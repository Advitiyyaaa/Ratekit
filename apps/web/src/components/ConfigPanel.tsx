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
        <div key={field.name} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary" htmlFor={`config-${field.name}`}>
              {field.label}
            </label>
            <span className="text-sm font-mono text-accent">
              {values[field.name] ?? field.defaultValue}
            </span>
          </div>
          <input
            id={`config-${field.name}`}
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={values[field.name] ?? field.defaultValue}
            onChange={(e) => onChange(field.name, Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${
                (((values[field.name] ?? field.defaultValue) - field.min) /
                  (field.max - field.min)) *
                100
              }%, var(--color-surface) ${
                (((values[field.name] ?? field.defaultValue) - field.min) /
                  (field.max - field.min)) *
                100
              }%, var(--color-surface) 100%)`,
            }}
          />
          <span className="text-xs text-text-muted">{field.description}</span>
        </div>
      ))}
    </div>
  );
}
