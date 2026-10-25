import { View } from 'react-native';

import { Flag } from '@/components/parent/Flag';
import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/design/colors';
import * as haptics from '@/design/haptics';
import { LANG_NAME, type Lang } from '@/lib/parent/i18n';
import { useParent } from '@/lib/parent/session';

const LANGS: Lang[] = ['uz', 'ru'];

// Two flags at the top of the parent's screens: Uzbek and Russian. The
// chosen one is ringed in accent, the other dimmed.
export function LangSwitch() {
  const colors = useColors();
  const { lang, setLang } = useParent();
  return (
    <View className="flex-row gap-1 rounded-full bg-surface p-1" accessibilityRole="radiogroup">
      {LANGS.map((l) => {
        const on = l === lang;
        return (
          <PressableScale
            key={l}
            pressedScale={0.9}
            className="h-9 w-12 items-center justify-center rounded-full"
            style={{ opacity: on ? 1 : 0.45 }}
            onPress={() => {
              if (on) return;
              haptics.selection();
              setLang(l);
            }}
            accessibilityRole="radio"
            accessibilityLabel={LANG_NAME[l]}
            accessibilityState={{ checked: on }}>
            <View
              className="rounded-md"
              style={{ borderWidth: 2, borderColor: on ? colors.accent : 'transparent', padding: 1 }}>
              <Flag lang={l} width={27} />
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
