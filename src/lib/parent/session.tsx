import { useQueryClient } from '@tanstack/react-query';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

import { ApiError, requestAs } from '@/lib/api/client';
import { getDeviceId } from '@/lib/auth/device';
import { deleteItem, getItem, setItem } from '@/lib/auth/secure-storage';
import { STRINGS, type Lang, type Strings } from './i18n';
import type { ParentChild } from './types';

// Parents have no accounts: a parent enters a child's 5-digit code and this
// phone keeps a read-only token for that child (one per child, several
// children per phone). The tokens live in secure storage, apart from the
// student's own session.
const CHILDREN_KEY = 'makonbook.parent_children';
const LANG_KEY = 'makonbook.parent_lang';
export const MAX_CHILDREN = 5;

export type SavedChild = ParentChild & { token: string };

export class TooManyChildrenError extends Error {}

type Method = 'GET' | 'POST';

type ParentContextValue = {
  /** False until the saved children and language are read at launch. */
  ready: boolean;
  kids: SavedChild[];
  lang: Lang;
  t: Strings;
  setLang: (lang: Lang) => void;
  /** The child shown on the parent's home. */
  selected: SavedChild | undefined;
  select: (clientId: number) => void;
  addChild: (code: string) => Promise<SavedChild>;
  removeChild: (clientId: number) => Promise<void>;
  /** A request as one child's parent; a 401 forgets that child on this phone. */
  call: <T>(kid: SavedChild, method: Method, path: string, body?: unknown) => Promise<T>;
};

const ParentContext = createContext<ParentContextValue | null>(null);

export function ParentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [kids, setKids] = useState<SavedChild[]>([]);
  const [lang, setLangState] = useState<Lang>('uz');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The list as last saved, for changes made from async callbacks.
  const saved = useRef<SavedChild[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getItem(CHILDREN_KEY).catch(() => null), getItem(LANG_KEY).catch(() => null)]).then(([list, l]) => {
      if (cancelled) return;
      let parsed: SavedChild[] = [];
      try {
        const v = list ? JSON.parse(list) : [];
        if (Array.isArray(v)) parsed = v.filter((k) => typeof k?.token === 'string' && typeof k?.client_id === 'number');
      } catch {
        // A broken entry: start over rather than get stuck.
      }
      saved.current = parsed;
      setKids(parsed);
      if (l === 'uz' || l === 'ru') setLangState(l);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function commit(next: SavedChild[]) {
    saved.current = next;
    setKids(next);
    if (next.length === 0) await deleteItem(CHILDREN_KEY).catch(() => {});
    else await setItem(CHILDREN_KEY, JSON.stringify(next)).catch(() => {});
  }

  function setLang(l: Lang) {
    setLangState(l);
    setItem(LANG_KEY, l).catch(() => {});
  }

  async function addChild(code: string): Promise<SavedChild> {
    const res = await requestAs<{ token: string; child: ParentChild }>(null, 'POST', '/v1/parent/login', {
      code,
      device_id: await getDeviceId(),
    });
    const kid: SavedChild = { ...res.child, token: res.token };
    const old = saved.current.find((k) => k.client_id === kid.client_id);
    if (!old && saved.current.length >= MAX_CHILDREN) {
      requestAs(res.token, 'POST', '/v1/parent/logout').catch(() => {});
      throw new TooManyChildrenError();
    }
    // The same child again: the new session replaces the old one.
    if (old) requestAs(old.token, 'POST', '/v1/parent/logout').catch(() => {});
    await commit(old ? saved.current.map((k) => (k.client_id === kid.client_id ? kid : k)) : [...saved.current, kid]);
    setSelectedId(kid.client_id);
    return kid;
  }

  async function forget(clientId: number) {
    queryClient.removeQueries({ queryKey: ['parent', clientId] });
    await commit(saved.current.filter((k) => k.client_id !== clientId));
  }

  async function removeChild(clientId: number) {
    const kid = saved.current.find((k) => k.client_id === clientId);
    // Tell the server, but never wait on it: the token is deleted here either way.
    if (kid) requestAs(kid.token, 'POST', '/v1/parent/logout').catch(() => {});
    await forget(clientId);
  }

  async function call<T>(kid: SavedChild, method: Method, path: string, body?: unknown): Promise<T> {
    try {
      return await requestAs<T>(kid.token, method, path, body);
    } catch (e) {
      // The session is gone, or the child no longer studies here. Only the
      // token still saved counts: an old one's late answer must not.
      if (e instanceof ApiError && e.status === 401 && saved.current.some((k) => k.token === kid.token)) {
        await forget(kid.client_id);
      }
      throw e;
    }
  }

  const selected = kids.find((k) => k.client_id === selectedId) ?? kids[0];

  return (
    <ParentContext
      value={{
        ready,
        kids,
        lang,
        t: STRINGS[lang],
        setLang,
        selected,
        select: setSelectedId,
        addChild,
        removeChild,
        call,
      }}>
      {children}
    </ParentContext>
  );
}

export function useParent(): ParentContextValue {
  const value = use(ParentContext);
  if (!value) throw new Error('useParent must be used inside <ParentProvider>');
  return value;
}
