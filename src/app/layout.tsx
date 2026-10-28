import type { Metadata } from 'next';
import { Newsreader, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';

const schibsted = Schibsted_Grotesk({
  variable: '--font-schibsted',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Nexo Assist',
  description: 'Agente de atendimento do service desk de TI da Nexo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${schibsted.variable} ${newsreader.variable} antialiased`}>{children}</body>
    </html>
  );
}
