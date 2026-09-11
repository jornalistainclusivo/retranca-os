import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { EntitlementProvider } from '@/lib/contexts/EntitlementContext';
import { DeveloperTools } from '@/components/DeveloperTools';

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'My Google AI Studio App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <EntitlementProvider>
          {children}
          <DeveloperTools />
        </EntitlementProvider>
      </body>
    </html>
  );
}
