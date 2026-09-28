import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'CineClue - Il Film del Giorno',
  description:
    'Indovina il Film del Giorno in 6 tentativi: un nuovo puzzle cinematografico ogni giorno, uguale per tutti nel mondo.',
  applicationName: 'CineClue',
  openGraph: {
    title: 'CineClue - Il Film del Giorno',
    description: 'Un nuovo puzzle cinematografico ogni giorno, in stile Wordle.',
    type: 'website',
    siteName: 'CineClue'
  },
  twitter: {
    card: 'summary',
    title: 'CineClue - Il Film del Giorno',
    description: 'Un nuovo puzzle cinematografico ogni giorno, in stile Wordle.'
  }
};

export const viewport: Viewport = {
  themeColor: '#0b0d14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}