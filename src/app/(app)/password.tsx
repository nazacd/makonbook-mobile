import { router } from 'expo-router';

import { PasswordForm } from '@/components/PasswordForm';

// From Profile. The sheet goes back down the way it came once saved.
export default function ChangePasswordScreen() {
  return <PasswordForm forced={false} onDone={() => router.back()} />;
}
