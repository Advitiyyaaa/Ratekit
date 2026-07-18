interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'typescript' }: CodeBlockProps) {

  return (
    <div className="relative group/code overflow-hidden">
      <pre className="m-0">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}
