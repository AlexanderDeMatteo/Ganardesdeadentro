import type { Metadata } from 'next'
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/app/context/auth-context'
import { RealtimeProvider } from '@/app/context/realtime-context'
import { CoachProvider } from '@/app/context/coach-context'
import { DataProvider } from '@/lib/data/store'
import { MetricsProvider } from '@/hooks/use-metrics'
import { NutritionProvider } from '@/hooks/use-nutrition'
import { CoachMascot } from '@/components/coach/coach-mascot'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const landingDisplay = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-landing-display',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fittrack.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'FitTrack - Transforma tu Cuerpo',
    template: '%s | FitTrack',
  },
  description: 'Entrenamientos personalizados, seguimiento de progreso y transformación fitness',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'FitTrack',
    title: 'FitTrack - Transforma tu Cuerpo',
    description: 'Entrenamientos personalizados, seguimiento de progreso y transformación fitness',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitTrack - Transforma tu Cuerpo',
    description: 'Entrenamientos personalizados, seguimiento de progreso y transformación fitness',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} ${landingDisplay.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <RealtimeProvider>
            <DataProvider>
              <MetricsProvider>
                <NutritionProvider>
                  <CoachProvider>
                    {children}
                    <CoachMascot />
                    <Toaster richColors position="top-center" />
                  </CoachProvider>
                </NutritionProvider>
              </MetricsProvider>
            </DataProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
