import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showCopy?: boolean;
}

export function CodeBlock({ code, language = 'typescript', showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code rounded-lg overflow-hidden">
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-accent transition-all opacity-0 group-hover/code:opacity-100 cursor-pointer z-10"
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      )}
      <pre className="m-0 rounded-lg">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
