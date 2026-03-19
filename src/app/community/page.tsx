'use client'

import Link from 'next/link'
import { Wine, ArrowLeft, Users, MessageCircle, Star, Heart } from 'lucide-react'

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900"><ArrowLeft className="h-5 w-5" /></Link>
          <Wine className="h-5 w-5 text-purple-600" />
          <span className="font-bold text-gray-900">Community</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Community</h1>
        <p className="text-gray-500 mb-8">Connect with fellow wine enthusiasts</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            { icon: <MessageCircle className="h-8 w-8 text-purple-600" />, title: 'Discussion Forum', desc: 'Share tasting notes, ask for recommendations, and discuss your favorite wines with the community.', count: '2.4K posts' },
            { icon: <Star className="h-8 w-8 text-yellow-500" />, title: 'Wine Reviews', desc: 'Read and write honest reviews. Help others discover great wines at every price point.', count: '850 reviews' },
            { icon: <Users className="h-8 w-8 text-blue-600" />, title: 'Tasting Groups', desc: 'Join local tasting groups or create your own. Share bottles and experiences together.', count: '45 groups' },
            { icon: <Heart className="h-8 w-8 text-red-500" />, title: 'Wishlists', desc: 'Share your wine wishlist. Get notified when community members have bottles you want.', count: '1.2K lists' },
          ].map((feature, i) => (
            <div key={i} className="bg-white rounded-xl border p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{feature.desc}</p>
              <span className="text-xs text-purple-600 font-medium">{feature.count}</span>
            </div>
          ))}
        </div>

        <div className="bg-purple-50 rounded-xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-600 mb-4">Community features are being built. Join the waitlist to be notified when they launch.</p>
          <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            Join Waitlist
          </button>
        </div>
      </main>
    </div>
  )
}
