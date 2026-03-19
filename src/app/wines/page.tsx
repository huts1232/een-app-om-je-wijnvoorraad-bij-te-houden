'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Search, Filter, Plus, Wine as WineIcon, MapPin, Calendar, DollarSign, Thermometer, MoreVertical, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';



interface WineItem {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  region: string;
  grape_variety: string;
  quantity: number;
  initial_price: number;
  current_price: number;
  purchase_date: string;
  location: string;
  storage_temperature: number;
  storage_humidity: number;
  status: string;
  created_at: string;
  wine_images: Array<{
    image_url: string;
  }>;
  drinking_predictions: Array<{
    optimal_start: string;
    optimal_end: string;
    risk_date: string;
  }>;
}

export default function WinesPage() {
  const supabase = useMemo(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [wines, setWines] = useState<WineItem[]>([]);
  const [filteredWines, setFilteredWines] = useState<WineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchWines();
  }, []);

  useEffect(() => {
    filterAndSortWines();
  }, [wines, searchTerm, filterStatus, filterRegion, sortBy, sortOrder]);

  const fetchWines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wines')
        .select(`
          *,
          wine_images (
            image_url
          ),
          drinking_predictions (
            optimal_start,
            optimal_end,
            risk_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      console.error('Error fetching wines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortWines = () => {
    let filtered = [...wines];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(wine => 
        wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.producer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wine.grape_variety.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(wine => wine.status === filterStatus);
    }

    // Region filter
    if (filterRegion !== 'all') {
      filtered = filtered.filter(wine => wine.region === filterRegion);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof WineItem];
      let bValue: any = b[sortBy as keyof WineItem];

      if (sortBy === 'name' || sortBy === 'producer') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredWines(filtered);
  };

  const getUniqueRegions = () => {
    const regions = wines.map(wine => wine.region).filter(Boolean);
    return [...new Set(regions)].sort();
  };

  const getPriceChange = (wine: WineItem) => {
    if (!wine.current_price || !wine.initial_price) return null;
    return ((wine.current_price - wine.initial_price) / wine.initial_price) * 100;
  };

  const getDrinkingWindow = (wine: WineItem) => {
    const prediction = wine.drinking_predictions?.[0];
    if (!prediction) return null;

    const now = new Date();
    const optimalStart = new Date(prediction.optimal_start);
    const optimalEnd = new Date(prediction.optimal_end);
    const riskDate = prediction.risk_date ? new Date(prediction.risk_date) : null;

    if (now < optimalStart) {
      return { status: 'wait', message: `Ready in ${Math.ceil((optimalStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365))} years` };
    } else if (now <= optimalEnd) {
      return { status: 'optimal', message: 'Optimal drinking window' };
    } else if (riskDate && now > riskDate) {
      return { status: 'risk', message: 'Past peak, drink soon' };
    } else {
      return { status: 'declining', message: 'Past optimal window' };
    }
  };

  const WineCard = ({ wine }: { wine: WineItem }) => {
    const priceChange = getPriceChange(wine);
    const drinkingWindow = getDrinkingWindow(wine);
    const primaryImage = wine.wine_images?.[0]?.image_url;

    return (
      <Link href={`/wines/${wine.id}`} className="block">
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
          <div className="aspect-[3/4] bg-gray-100 relative">
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={wine.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <WineIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
            {wine.quantity > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                {wine.quantity} bottles
              </div>
            )}
          </div>
          
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
              {wine.producer} {wine.name}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{wine.vintage} • {wine.region}</p>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {wine.location || 'Not specified'}
              </div>
              {drinkingWindow && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  drinkingWindow.status === 'optimal' ? 'bg-green-100 text-green-800' :
                  drinkingWindow.status === 'wait' ? 'bg-yellow-100 text-yellow-800' :
                  drinkingWindow.status === 'risk' ? 'bg-red-100 text-red-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {drinkingWindow.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Value: </span>
                <span className="font-semibold">${wine.current_price?.toFixed(2) || wine.initial_price?.toFixed(2) || '—'}</span>
              </div>
              {priceChange && (
                <div className={`flex items-center text-sm font-medium ${
                  priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {priceChange > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : priceChange < 0 ? (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  ) : null}
                  {Math.abs(priceChange).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const WineListItem = ({ wine }: { wine: WineItem }) => {
    const priceChange = getPriceChange(wine);
    const drinkingWindow = getDrinkingWindow(wine);
    const primaryImage = wine.wine_images?.[0]?.image_url;

    return (
      <Link href={`/wines/${wine.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 flex items-center space-x-4">
          <div className="w-16 h-20 bg-gray-100 rounded flex-shrink-0 relative">
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={wine.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <WineIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {wine.producer} {wine.name}
                </h3>
                <p className="text-sm text-gray-600">{wine.vintage} • {wine.grape_variety}</p>
                <p className="text-sm text-gray-500">{wine.region}</p>
              </div>

              <div className="flex items-center space-x-6 ml-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="font-semibold">{wine.quantity}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">Value</p>
                  <p className="font-semibold">${wine.current_price?.toFixed(2) || wine.initial_price?.toFixed(2) || '—'}</p>
                </div>

                {priceChange && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Change</p>
                    <div className={`flex items-center font-semibold ${
                      priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {priceChange > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : priceChange < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : null}
                      {Math.abs(priceChange).toFixed(1)}%
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-xs text-gray-500">Storage</p>
                  <div className="flex items-center text-sm">
                    <Thermometer className="h-3 w-3 mr-1" />
                    {wine.storage_temperature}°F
                  </div>
                </div>

                {drinkingWindow && (
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    drinkingWindow.status === 'optimal' ? 'bg-green-100 text-green-800' :
                    drinkingWindow.status === 'wait' ? 'bg-yellow-100 text-yellow-800' :
                    drinkingWindow.status === 'risk' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {drinkingWindow.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-[3/4] bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wine Collection</h1>
            <p className="mt-2 text-gray-600">
              {filteredWines.length} of {wines.length} wines
            </p>
          </div>
          <Link
            href="/wines/add"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Wine
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wines, producers, regions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
              >
                <option value="name">Name</option>
                <option value="producer">Producer</option>
                <option value="vintage">Vintage</option>
                <option value="current_price">Value</option>
                <option value="purchase_date">Purchase Date</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Status</option>
                    <option value="cellared">Cellared</option>
                    <option value="consumed">Consumed</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="all">All Regions</option>
                    {getUniqueRegions().map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setFilterRegion('all');
                      setSortBy('name');
                      setSortOrder('asc');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <WineIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wines found</h3>
            <p className="text-gray-600 mb-6">
              {wines.length === 0 
                ? "Start building your collection by adding your first wine."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {wines.length === 0 && (
              <Link
                href="/wines/add"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Wine
              </Link>
            )}
          </div>
        ) : (
          <div>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWines.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredWines.map((wine) => (
                  <WineListItem key={wine.id} wine={wine} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}