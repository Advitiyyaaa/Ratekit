import type { ConfigField } from '../api';

interface ConfigPanelProps {
  fields: ConfigField[];
  values: Record<string, number>;
  onChange: (name: string, value: number) => void;
}

export function ConfigPanel({ fields, values, onChange }: ConfigPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary" htmlFor={`config-${field.name}`}>
              {field.label}
            </label>
            <span className="text-sm font-mono text-text-primary font-bold">
              {values[field.name] ?? field.defaultValue}
            </span>
          </div>
          {(() => {
            const val = values[field.name] ?? field.defaultValue;
            const pct = ((val - field.min) / (field.max - field.min)) * 100;
            return (
              <input
                id={`config-${field.name}`}
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={val}
                onChange={(e) => onChange(field.name, Number(e.target.value))}
                className="rate-range"
                style={{
                  background: `linear-gradient(to right, var(--color-text-primary) 0%, var(--color-text-primary) ${pct}%, var(--color-surface-hover) ${pct}%, var(--color-surface-hover) 100%)`,
                  border: '2px solid var(--color-border)',
                }}
              />
            );
          })()}
          <span className="text-xs text-text-muted">{field.description}</span>
        </div>
      ))}
    </div>
  );
}
