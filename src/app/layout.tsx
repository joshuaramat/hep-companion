import './globals.css'
import type { Metadata } from 'next'

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
      <body className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
} 