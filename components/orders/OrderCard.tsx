'use client'

import Link from 'next/link'
import { Order } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, getStyleDirectionLabel } from '@/lib/utils'

interface OrderCardProps {
  order: Order
  onDelete?: (order: Order) => void
}

export function OrderCard({ order, onDelete }: OrderCardProps) {
  return (
    <div className="card hover:border-[#3E3E3E] transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {order.product_name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            #{order.id.slice(0, 8).toUpperCase()} · {formatDate(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-4 mb-5">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Photos</p>
          <p className="text-sm text-text-primary font-medium mt-0.5">{order.photo_count}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">Style</p>
          <p className="text-sm text-text-primary font-medium mt-0.5">
            {order.style_direction === 'other' && order.style_direction_custom
              ? order.style_direction_custom
              : getStyleDirectionLabel(order.style_direction)}
          </p>
        </div>
        {order.extra_fast_delivery && (
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Delivery</p>
            <p className="text-sm text-accent font-medium mt-0.5">⚡ Express 24h</p>
          </div>
        )}
      </div>

      {/* Description preview */}
      {order.description && (
        <p className="text-sm text-text-muted line-clamp-2 mb-5 leading-relaxed">
          {order.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-[#2E2E2E]">
        <Link
          href={`/orders/${order.id}`}
          className="flex-1 text-center text-sm font-medium text-text-secondary hover:text-accent transition-colors py-2"
        >
          View Details
        </Link>
        {order.status === 'pending' && (
          <>
            <div className="w-px h-4 bg-[#2E2E2E]" />
            <Link
              href={`/orders/${order.id}/edit`}
              className="flex-1 text-center text-sm font-medium text-text-secondary hover:text-accent transition-colors py-2"
            >
              Edit
            </Link>
            {onDelete && (
              <>
                <div className="w-px h-4 bg-[#2E2E2E]" />
                <button
                  onClick={() => onDelete(order)}
                  className="flex-1 text-center text-sm font-medium text-text-muted hover:text-status-cancelled transition-colors py-2"
                >
                  Delete
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
