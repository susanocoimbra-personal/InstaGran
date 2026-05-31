export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-9 w-9 animate-spin rounded-full border-2 border-line border-t-ink ${className}`}
      role="status"
      aria-label="A carregar"
    />
  );
}
