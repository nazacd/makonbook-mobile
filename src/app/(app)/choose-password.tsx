import { PasswordForm } from '@/components/PasswordForm';

// The only screen while the temporary password is in use. Saving clears
// must_change_password, the signed-in layout guards this screen, and the
// router moves to Classes by itself.
export default function ChoosePasswordScreen() {
  return <PasswordForm forced />;
}
