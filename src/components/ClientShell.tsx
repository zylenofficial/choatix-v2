'use client'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
