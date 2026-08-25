import type { Metadata } from 'next'
import './globals.css'
import { ClientShell } from '@/components/ClientShell'

export const metadata: Metadata = {
  title: 'Phantom',
  description: 'Gaming Optimization Suite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
