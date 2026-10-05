import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AiRuntimeProvider } from '@/lib/contexts/AiRuntimeContext';
import { LocalAiSettings } from '@/components/LocalAiSettings';

export const metadata: Metadata = {
  title: 'Retranca OS',
  description: 'Organização editorial local com fluxos personalizáveis e IA local opcional.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <AiRuntimeProvider>
          <LocalAiSettings />
          {children}
        </AiRuntimeProvider>
      </body>
    </html>
  );
}
