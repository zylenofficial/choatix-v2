'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}
interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif', color: '#fff',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{
                padding: '10px 24px', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, background: 'transparent', color: '#fff',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
