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
    <div className="relative group/code overflow-hidden">
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-none bg-surface border-2 border-border text-text-primary hover:bg-surface-hover transition-all opacity-90 hover:opacity-100 shadow-[2px_2px_0px_0px_var(--color-shadow)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer z-10 flex items-center gap-1.5"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      )}
      <pre className="m-0">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
