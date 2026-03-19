'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Wine, Bell, ArrowLeft, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AlertsPage() {
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('drinking_alerts').select('*, wines(name, producer, vintage)').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { setAlerts(data || []); setLoading(false) })
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
            <Wine className="h-5 w-5 text-purple-600" />
            <span className="font-bold text-gray-900">Alerts</span>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drinking Alerts</h1>
            <p className="text-sm text-gray-500 mt-1">Wines approaching their optimal drinking window</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
            <Bell className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">{alerts.length} alerts</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All clear!</h3>
            <p className="text-sm text-gray-500 mb-4">No drinking alerts right now. We&apos;ll notify you when wines reach their optimal window.</p>
            <Link href="/wines" className="text-sm text-purple-600 hover:underline">View your collection →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${!alert.is_read ? 'border-l-4 border-l-orange-400' : ''}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.alert_type === 'drinking_window' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                  {alert.alert_type === 'drinking_window' ? <Clock className="h-5 w-5 text-orange-600" /> : <AlertTriangle className="h-5 w-5 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.wines?.name || 'Unknown wine'} {alert.wines?.vintage || ''}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{alert.message || 'This wine is entering its optimal drinking window'}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
