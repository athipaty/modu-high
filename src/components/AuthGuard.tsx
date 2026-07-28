import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { verify } from '../lib/auth'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'fail'>('checking')

  useEffect(() => {
    verify().then((ok) => setStatus(ok ? 'ok' : 'fail'))
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Checking session…</div>
      </div>
    )
  }

  if (status === 'fail') {
    return <Navigate to="/login" replace />
  }

  return children
}
