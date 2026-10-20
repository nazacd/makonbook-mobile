import { Alert } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  confirm: string;
  cancel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/** Asks before doing something that can't be undone. (Web has its own, in confirm.web.ts.) */
export function confirm({ title, message, confirm, cancel = 'Cancel', destructive, onConfirm }: ConfirmOptions) {
  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    { text: confirm, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
