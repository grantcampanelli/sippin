import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { Providers } from './providers'
import { Navigation } from '@/components/Navigation'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700']
})

const theme = createTheme({
  primaryColor: 'wine',
  colors: {
    wine: [
      '#fff5f5',
      '#ffe3e3',
      '#ffc9c9',
      '#ffa8a8',
      '#ff8787',
      '#ff6b6b',
      '#c92a2a',
      '#a61e1e',
      '#8b1a1a',
      '#721c1c',
    ],
    amber: [
      '#fffbf0',
      '#fff4d6',
      '#ffe7a3',
      '#ffd970',
      '#ffcc3d',
      '#ffbf0a',
      '#cc9900',
      '#997300',
      '#664d00',
      '#332600',
    ],
    burgundy: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#7f1d1d',
      '#6b1a1a',
      '#581818',
      '#451515',
    ],
  },
  fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  headings: {
    fontFamily: 'var(--font-playfair), Georgia, serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
})

export const metadata: Metadata = {
  title: 'Sippin',
  description: 'Track and manage your beverage collection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <Providers>
          <MantineProvider theme={theme} defaultColorScheme="light">
            <Notifications />
            <Navigation />
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  )
}

