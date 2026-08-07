interface EmptyStateProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <section className="empty-state" role="alert">
      <span className="empty-seed" aria-hidden="true" />
      <p>{message}</p>
      <button className="toolbar-button primary" type="button" onClick={onAction}>{actionLabel}</button>
    </section>
  );
}
