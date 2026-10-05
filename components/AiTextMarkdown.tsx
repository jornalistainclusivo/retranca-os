import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Generated text must not cause automatic image requests to destinations in the output.
const components: Components = {
  img: ({ alt }) => <span>{alt || 'Imagem'}</span>,
};

export function AiTextMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
