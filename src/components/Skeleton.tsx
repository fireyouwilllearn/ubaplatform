const baseClass = 'animate-pulse rounded-xl bg-[var(--navy4)]';

const variantClasses: Record<string, string> = {
  text: 'h-4 w-full rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-xl',
};

type SkeletonProps = {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
};

export function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
