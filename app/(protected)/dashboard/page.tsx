'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/types'
import { OrderCard } from '@/components/orders/OrderCard'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { PageLoader } from '@/components/ui/LoadingSpinner'

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOrders = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleDelete = async () => {
    if (!orderToDelete) return
    setDeleting(true)

    const supabase = createClient()
    await supabase.from('orders').delete().eq('id', orderToDelete.id)

    setOrders(prev => prev.filter(o => o.id !== orderToDelete.id))
    setOrderToDelete(null)
    setDeleting(false)
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return <PageLoader />

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1">My Orders</h1>
          <p className="text-text-muted text-sm">
            {orders.length === 0
              ? 'No orders yet'
              : `${orders.length} order${orders.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        <Link href="/orders/new" className="btn-primary text-sm whitespace-nowrap">
          + New Order
        </Link>
      </div>

      {/* Filter tabs */}
      {orders.length > 0 && (
        <div className="flex gap-1 mb-6 bg-surface rounded-[12px] p-1 w-fit flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                px-4 py-2 rounded-[8px] text-sm font-medium transition-all duration-200
                ${filter === f.value
                  ? 'bg-card text-text-primary border border-[#2E2E2E]'
                  : 'text-text-muted hover:text-text-secondary'
                }
              `}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${filter === f.value ? 'text-accent' : 'text-text-muted'}`}>
                {f.value === 'all' ? orders.length : orders.filter(o => o.status === f.value).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface border border-[#2E2E2E] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {filter === 'all' ? (
            <>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">No orders yet</h3>
              <p className="text-text-muted text-sm mb-6">Create your first order to get started</p>
              <Link href="/orders/new" className="btn-primary text-sm inline-block">
                Create First Order
              </Link>
            </>
          ) : (
            <>
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">No {filter.replace('_', ' ')} orders</h3>
              <button onClick={() => setFilter('all')} className="text-accent text-sm hover:text-accent-dark transition-colors">
                Show all orders
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onDelete={order.status === 'pending' ? setOrderToDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!orderToDelete}
        title="Delete Order"
        message={`Are you sure you want to delete "${orderToDelete?.product_name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Order'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setOrderToDelete(null)}
      />
    </div>
  )
}
