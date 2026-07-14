import { Settings, Zap } from 'lucide-react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 24, className = '' }: LogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Settings
        size={size}
        className="text-text-muted opacity-80"
        strokeWidth={1.5}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Zap
          size={size * 0.55}
          className="text-warning fill-warning"
          strokeWidth={0}
        />
      </div>
    </div>
  );
}

export function LogoBox({ size = 48, className = '' }: LogoProps) {
  return (
    <div
      className={`rounded-xl bg-surface-elevated border border-border flex items-center justify-center shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <Logo size={size * 0.6} />
    </div>
  );
}
