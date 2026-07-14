interface SkeletonProps {
  /** Width as a CSS value e.g. '100%', '12rem' */
  width?: string;
  /** Height as a CSS value e.g. '1rem', '200px' */
  height?: string;
  /** Border-radius override e.g. '9999px' for a circle */
  rounded?: string;
  className?: string;
}

/**
 * A shimmer skeleton placeholder used during loading states.
 * Relies on the `.skeleton` utility class in index.css.
 */
export function Skeleton({ width = '100%', height = '1rem', rounded, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: rounded }}
      aria-hidden="true"
    />
  );
}

/** A full skeleton card matching the glass-card layout */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card p-5 ${className}`} style={{ cursor: 'default' }}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="2rem" height="2rem" rounded="8px" />
        <Skeleton width="60%" height="1rem" />
      </div>
      <Skeleton width="100%" height="0.75rem" className="mb-2" />
      <Skeleton width="80%" height="0.75rem" className="mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton width="4rem" height="1.25rem" rounded="9999px" />
        <Skeleton width="4rem" height="1.25rem" rounded="9999px" />
      </div>
      <Skeleton width="40%" height="0.75rem" />
    </div>
  );
}
