import type { Metadata } from 'next'
import './globals.css'
import TitleBar from '@/components/TitleBar'

export const metadata: Metadata = {
  title: 'Choatix',
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
        <TitleBar />
        <div className="h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
