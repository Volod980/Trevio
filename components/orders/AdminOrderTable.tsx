'use client'

import Link from 'next/link'
import { Order, OrderStatus } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'

interface AdminOrderTableProps {
  orders: Order[]
  activeFilter: OrderStatus | 'all'
  onFilterChange: (filter: OrderStatus | 'all') => void
}

const FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All Orders', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export function AdminOrderTable({ orders, activeFilter, onFilterChange }: AdminOrderTableProps) {
  const filtered = activeFilter === 'all'
    ? orders
    : orders.filter(o => o.status === activeFilter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-surface rounded-[12px] p-1 w-fit flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`
              px-4 py-2 rounded-[8px] text-sm font-medium transition-all duration-200
              ${activeFilter === f.value
                ? 'bg-card text-text-primary border border-[#2E2E2E]'
                : 'text-text-muted hover:text-text-secondary'
              }
            `}
          >
            {f.label}
            <span className={`ml-1.5 text-xs ${activeFilter === f.value ? 'text-accent' : 'text-text-muted'}`}>
              {f.value === 'all' ? orders.length : orders.filter(o => o.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[#2E2E2E]">
        <table className="w-full">
          <thead>
            <tr className="bg-surface border-b border-[#2E2E2E]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Order ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Client</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Photos</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-text-muted text-sm">
                  No orders found
                </td>
              </tr>
            ) : (
              filtered.map(order => (
                <tr
                  key={order.id}
                  className="bg-card hover:bg-[#252525] transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-text-muted">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-text-secondary">
                      {order.user_email || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-text-primary font-medium">
                      {order.product_name}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-text-secondary">{order.photo_count}</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-text-muted">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-accent hover:text-accent-dark font-medium transition-colors"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
