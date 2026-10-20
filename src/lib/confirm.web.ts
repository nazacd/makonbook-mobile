type ConfirmOptions = {
  title: string;
  message: string;
  confirm: string;
  cancel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

// React Native Web has no Alert: the browser's own dialog (development builds).
export function confirm({ title, message, onConfirm }: ConfirmOptions) {
  if (window.confirm(`${title}\n\n${message}`)) onConfirm();
}
