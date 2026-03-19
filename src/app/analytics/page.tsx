'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Wine, ArrowLeft, TrendingUp, DollarSign, BarChart3, MapPin } from 'lucide-react'

export default function AnalyticsPage() {
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [wines, setWines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('wines').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setWines(data || []); setLoading(false) })
  }, [supabase])

  const totalBottles = wines.reduce((sum, w) => sum + (w.quantity || 0), 0)
  const totalValue = wines.reduce((sum, w) => sum + ((w.current_market_value || w.purchase_price || 0) * (w.quantity || 0)), 0)
  const totalCost = wines.reduce((sum, w) => sum + ((w.purchase_price || 0) * (w.quantity || 0)), 0)
  const regions = [...new Set(wines.map(w => w.region).filter(Boolean))]
  const countries = [...new Set(wines.map(w => w.country).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
          <Wine className="h-5 w-5 text-purple-600" />
          <span className="font-bold text-gray-900">Analytics</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Collection Analytics</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Bottles', value: totalBottles.toString(), icon: <Wine className="h-5 w-5 text-purple-600" />, bg: 'bg-purple-50' },
                { label: 'Collection Value', value: `€${totalValue.toLocaleString()}`, icon: <DollarSign className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
                { label: 'Total Invested', value: `€${totalCost.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
                { label: 'ROI', value: totalCost > 0 ? `${(((totalValue - totalCost) / totalCost) * 100).toFixed(1)}%` : '0%', icon: <BarChart3 className="h-5 w-5 text-orange-600" />, bg: 'bg-orange-50' },
              ].map((stat, i) => (
                <div key={i} className={`${stat.bg} rounded-xl p-5`}>
                  <div className="flex items-center justify-between mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-purple-600" /> By Region</h3>
                {regions.length === 0 ? (
                  <p className="text-sm text-gray-500">No regions recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {regions.map(region => {
                      const count = wines.filter(w => w.region === region).reduce((s, w) => s + (w.quantity || 0), 0)
                      const pct = totalBottles > 0 ? (count / totalBottles) * 100 : 0
                      return (
                        <div key={region}>
                          <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{region}</span><span className="text-gray-500">{count} bottles</span></div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold text-gray-900 mb-4">By Country</h3>
                {countries.length === 0 ? (
                  <p className="text-sm text-gray-500">No countries recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {countries.map(country => {
                      const count = wines.filter(w => w.country === country).reduce((s, w) => s + (w.quantity || 0), 0)
                      const pct = totalBottles > 0 ? (count / totalBottles) * 100 : 0
                      return (
                        <div key={country}>
                          <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{country}</span><span className="text-gray-500">{count} bottles</span></div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border p-6 col-span-full">
                <h3 className="font-semibold text-gray-900 mb-4">Top Wines by Value</h3>
                {wines.length === 0 ? (
                  <p className="text-sm text-gray-500">Add wines to see analytics</p>
                ) : (
                  <div className="space-y-2">
                    {wines.sort((a, b) => ((b.current_market_value || 0) * (b.quantity || 0)) - ((a.current_market_value || 0) * (a.quantity || 0))).slice(0, 5).map((wine, i) => (
                      <div key={wine.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-400 w-6">#{i + 1}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{wine.name} {wine.vintage || ''}</p>
                            <p className="text-xs text-gray-500">{wine.producer} · {wine.quantity} bottles</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-green-700">€{((wine.current_market_value || wine.purchase_price || 0) * (wine.quantity || 0)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
