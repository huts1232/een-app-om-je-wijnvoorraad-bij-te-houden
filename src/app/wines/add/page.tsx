'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Wine, Save, Loader2 } from 'lucide-react'

export default function AddWinePage() {
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', producer: '', vintage: new Date().getFullYear(), region: '', country: '',
    quantity: 1, purchase_price: '', current_market_value: '',
  })

  function update(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.producer) return
    setSaving(true)
    const { error } = await supabase.from('wines').insert({
      name: form.name, producer: form.producer, vintage: form.vintage,
      region: form.region || null, country: form.country || null,
      quantity: form.quantity,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      current_market_value: form.current_market_value ? parseFloat(form.current_market_value) : null,
    })
    setSaving(false)
    if (!error) router.push('/wines')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/wines" className="text-gray-500 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
          <Wine className="h-5 w-5 text-purple-600" />
          <span className="font-bold text-gray-900">Add Wine</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Wine Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Wine Name *</label>
                <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Château Margaux" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Producer *</label>
                <input type="text" required value={form.producer} onChange={e => update('producer', e.target.value)}
                  placeholder="e.g. Château Margaux" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                <input type="number" value={form.vintage} onChange={e => update('vintage', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={e => update('quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input type="text" value={form.region} onChange={e => update('region', e.target.value)}
                  placeholder="e.g. Bordeaux" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" value={form.country} onChange={e => update('country', e.target.value)}
                  placeholder="e.g. France" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Pricing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (€)</label>
                <input type="number" step="0.01" value={form.purchase_price} onChange={e => update('purchase_price', e.target.value)}
                  placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (€)</label>
                <input type="number" step="0.01" value={form.current_market_value} onChange={e => update('current_market_value', e.target.value)}
                  placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/wines" className="px-5 py-2.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={saving || !form.name || !form.producer}
              className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Add Wine'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
