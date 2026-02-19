'use client'

import { OrderStatus } from '@/types'
import { getStatusLabel } from '@/lib/utils'

interface StatusBadgeProps {
  status: OrderStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const styles: Record<OrderStatus, string> = {
    pending: 'bg-[#737373]/15 text-[#A3A3A3] border border-[#737373]/30',
    in_progress: 'bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30',
    completed: 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30',
    cancelled: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30',
  }

  const dotColors: Record<OrderStatus, string> = {
    pending: 'bg-[#737373]',
    in_progress: 'bg-[#EAB308]',
    completed: 'bg-[#4ADE80]',
    cancelled: 'bg-[#EF4444]',
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2.5 py-1'
    : 'text-xs px-3 py-1.5'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${styles[status]} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {getStatusLabel(status)}
    </span>
  )
}
