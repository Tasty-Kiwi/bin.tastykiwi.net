import { Icon } from "./Icon";

interface ToastProps {
  message?: string;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast" role="alert" aria-live="assertive">
      <span>{message}</span>
      <button className="icon-button toast-close" type="button" onClick={onDismiss} aria-label="Dismiss message">
        <Icon name="close" />
      </button>
    </div>
  );
}
