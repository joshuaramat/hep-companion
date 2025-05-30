import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { Suspense } from 'react'
import MainHeader from '@/components/layout/MainHeader'
import Footer from '@/components/layout/Footer'
import ClientSessionProvider from '@/components/auth/ClientSessionProvider'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/Toast'

// Validate environment variables on app startup
import '@/config/env'

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
          <ToastProvider>
            <ClientSessionProvider>
              <MainHeader />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <ToastContainer />
            </ClientSessionProvider>
          </ToastProvider>
        </Suspense>
      </body>
    </html>
  )
} 