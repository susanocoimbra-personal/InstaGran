export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-10 w-10 animate-spin rounded-full border-[3px] border-primary/25 border-t-primary ${className}`}
      role="status"
      aria-label="A carregar"
    />
  );
}
