'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { TrendingUp, TrendingDown, Wine, AlertTriangle, Plus, Eye, Calendar, DollarSign } from 'lucide-react'



interface WineType {
  id: string
  name: string
  producer: string
  vintage: number
  region: string
  quantity: number
  initial_price: number
  current_price: number
  purchase_date: string
  status: string
}

interface Alert {
  id: string
  wine_id: string
  alert_type: string
  priority: string
  message: string
  is_read: boolean
  created_at: string
  wine: {
    name: string
    producer: string
    vintage: number
  }
}

interface PriceHistory {
  wine_id: string
  price: number
  recorded_at: string
}

export default function Dashboard() {
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), [])
  const [wines, setWines] = useState<WineType[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in to view your dashboard')
        return
      }
      
      setUserId(user.id)

      // Load wines
      const { data: winesData, error: winesError } = await supabase
        .from('wines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (winesError) throw winesError

      // Load alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('drinking_alerts')
        .select(`
          *,
          wine:wines(name, producer, vintage)
        `)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)

      if (alertsError) throw alertsError

      // Load recent price history for portfolio trend
      const { data: priceHistoryData, error: priceHistoryError } = await supabase
        .from('price_history')
        .select('wine_id, price, recorded_at')
        .in('wine_id', winesData?.map(w => w.id) || [])
        .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: true })

      if (priceHistoryError) throw priceHistoryError

      setWines(winesData || [])
      setAlerts(alertsData || [])
      setPriceHistory(priceHistoryData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('drinking_alerts')
        .update({ is_read: true })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (err: any) {
      console.error('Error marking alert as read:', err.message)
    }
  }

  const calculatePortfolioValue = () => {
    return wines.reduce((total, wine) => total + (wine.current_price * wine.quantity), 0)
  }

  const calculateInitialValue = () => {
    return wines.reduce((total, wine) => total + (wine.initial_price * wine.quantity), 0)
  }

  const calculateDailyChange = () => {
    const currentValue = calculatePortfolioValue()
    const initialValue = calculateInitialValue()
    const change = currentValue - initialValue
    const changePercent = initialValue > 0 ? (change / initialValue) * 100 : 0
    return { change, changePercent }
  }

  const getTopWines = () => {
    return wines
      .map(wine => ({
        ...wine,
        totalValue: wine.current_price * wine.quantity,
        appreciation: wine.current_price - wine.initial_price
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
  }

  const getDrinkingSoonWines = () => {
    return wines
      .filter(wine => wine.status === 'cellared')
      .slice(0, 3)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow h-96"></div>
              <div className="bg-white p-6 rounded-lg shadow h-96"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const portfolioValue = calculatePortfolioValue()
  const { change, changePercent } = calculateDailyChange()
  const topWines = getTopWines()
  const drinkingSoonWines = getDrinkingSoonWines()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back to your wine cellar</p>
          </div>
          <Link
            href="/wines/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Wine
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolioValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Change</p>
                <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}${change.toLocaleString()}
                </p>
                <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
                </p>
              </div>
              {change >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bottles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wines.reduce((total, wine) => total + wine.quantity, 0)}
                </p>
              </div>
              <Wine className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${alerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Wines */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Top Wines by Value</h2>
            </div>
            <div className="p-6">
              {topWines.length === 0 ? (
                <div className="text-center py-8">
                  <Wine className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No wines in your collection yet</p>
                  <Link
                    href="/wines/add"
                    className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                  >
                    Add your first wine
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {topWines.map((wine, index) => (
                    <div key={wine.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{wine.name}</h3>
                          <p className="text-sm text-gray-600">{wine.producer} • {wine.vintage}</p>
                          <p className="text-xs text-gray-500">{wine.quantity} bottle{wine.quantity > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${wine.totalValue.toLocaleString()}</p>
                        <p className={`text-sm ${wine.appreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {wine.appreciation >= 0 ? '+' : ''}${wine.appreciation.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/wines"
                    className="block text-center text-blue-600 hover:text-blue-800 font-medium mt-4"
                  >
                    View all wines
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
                <Link
                  href="/alerts"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active alerts</p>
                  <p className="text-sm text-gray-500 mt-1">We'll notify you about optimal drinking windows</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 mt-1 ${
                          alert.priority === 'high' ? 'text-red-500' :
                          alert.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                        }`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {alert.wine.name} {alert.wine.vintage}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => markAlertAsRead(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drinking Soon */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Drinking Soon</h2>
            </div>
            <div className="p-6">
              {drinkingSoonWines.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No wines ready for drinking</p>
                  <p className="text-sm text-gray-500 mt-1">Check back as your wines mature</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {drinkingSoonWines.map((wine) => (
                    <Link
                      key={wine.id}
                      href={`/wines/${wine.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{wine.name}</h3>
                        <p className="text-sm text-gray-600">{wine.producer} • {wine.vintage}</p>
                        <p className="text-xs text-gray-500">{wine.region}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${wine.current_price}</p>
                        <p className="text-xs text-gray-500">{wine.quantity} bottle{wine.quantity > 1 ? 's' : ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/wines/add"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-900">Add Wine</span>
                </Link>
                <Link
                  href="/analytics"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-900">Analytics</span>
                </Link>
                <Link
                  href="/wines"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Eye className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-900">View Collection</span>
                </Link>
                <Link
                  href="/community"
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Wine className="h-8 w-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-900">Community</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}