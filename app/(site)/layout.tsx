import '../globals.css'
import { Inter } from 'next/font/google'

export const metadata = {
  title: 'Gridiron GM — Win Every Sunday',
  description: 'Start/Sit, Trade Analyzer, Weekly Rankings, League Sync.',
}; // ← no themeColor here

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)',  color: '#0ea5a3' },
  ],
};

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }:{ children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-b from-black via-zinc-950 to-black text-zinc-200 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}