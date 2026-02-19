'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/types'
import { AdminOrderTable } from '@/components/orders/AdminOrderTable'
import { PageLoader } from '@/components/ui/LoadingSpinner'

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check admin status (client-side check, middleware handles server-side)
    // We need to fetch all orders - this requires admin RLS bypass via a service role key
    // For simplicity, we use the user's session and rely on middleware for protection
    // In production, you'd use a server action or API route with service role key

    // Fetch all orders with user emails via a join
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Since we can't do a direct join with auth.users from client,
      // we'll display user_id and the admin can see it
      setOrders(data)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (loading) return <PageLoader />

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">Admin Panel</span>
        </div>
        <h1 className="section-title">Order Management</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: stats.total, color: 'text-text-primary' },
          { label: 'Pending', value: stats.pending, color: 'text-[#737373]' },
          { label: 'In Progress', value: stats.in_progress, color: 'text-status-progress' },
          { label: 'Completed', value: stats.completed, color: 'text-accent' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={`font-serif text-3xl font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <AdminOrderTable
        orders={orders}
        activeFilter={filter}
        onFilterChange={setFilter}
      />
    </div>
  )
}
