interface LoadingSpinnerProps {
  /** Size in px (default 32) */
  size?: number;
  /** Tailwind/CSS class for the spinner ring color (default accent) */
  colorClass?: string;
}

/**
 * A consistent spinning loader used across all async loading states.
 */
export function LoadingSpinner({ size = 32, colorClass = 'border-accent/40 border-t-accent' }: LoadingSpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-2 animate-spin ${colorClass}`}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-label="Loading"
    />
  );
}

/** Centered full-area loading state */
export function LoadingState({ minHeight = '50vh', label = 'Loading...' }: { minHeight?: string; label?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={36} />
        <span className="text-text-muted text-sm">{label}</span>
      </div>
    </div>
  );
}
