import { router } from 'expo-router';

import { useAuth } from '@/lib/auth/session';

// "Home" depends on who is using the phone: Classes when signed in, the
// welcome screen otherwise. Navigating to "/" doesn't work signed out — "/"
// is the guarded Classes tab, so the navigation goes nowhere.
export function useHomeHref(): '/' | '/welcome' {
  return useAuth().status === 'signedIn' ? '/' : '/welcome';
}

// dismissTo goes back down the stack to home when it is already there (the
// usual case: welcome → Level Check → test), so the screens leave the way they
// came; otherwise it replaces the current screen with home.
export function useGoHome() {
  const home = useHomeHref();
  return () => router.dismissTo(home);
}
