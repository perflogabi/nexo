import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nexo Assist',
  description: 'Agente de atendimento do service desk de TI da Nexo',
};

/**
 * Fontes: não usamos `next/font/google` — o download no build/dev falha com
 * ETIMEDOUT em redes sem acesso ao Google. CSS carrega via link (quando online)
 * e cai em Georgia / system-ui (já definidos em globals.css).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:wght@400;500;600&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
