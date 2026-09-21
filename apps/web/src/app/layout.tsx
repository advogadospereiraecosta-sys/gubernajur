import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gubernajur - Gestão para Escritórios de Advocacia',
  description: 'Software SaaS de gestão para escritórios de advocacia. Controle processos, clientes, prazos e financeiro em um único lugar.',
  keywords: ['advocacia', 'gestão', 'escritório', 'processos', 'jurídico', 'SAAS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
