import './globals.css'
import type { Metadata } from 'next'
import MainHeader from '@/components/layout/MainHeader'
import Footer from '@/components/layout/Footer'
import { Suspense } from 'react'
import ClientSessionProvider from '@/components/auth/ClientSessionProvider'

export const metadata: Metadata = {
  title: 'HEP Companion - AI-Powered Exercise Suggestions',
  description: 'Generate personalized home exercise programs for physical therapy patients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Suspense fallback={null}>
          <ClientSessionProvider>
            <MainHeader />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ClientSessionProvider>
        </Suspense>
      </body>
    </html>
  )
} 