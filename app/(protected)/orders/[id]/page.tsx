'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderFile, OrderStatus } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { FileViewer } from '@/components/orders/FileViewer'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDateTime, getStyleDirectionLabel } from '@/lib/utils'

const STATUS_TIMELINE: { status: OrderStatus; label: string; description: string }[] = [
  { status: 'pending', label: 'Order Submitted', description: 'Your order has been received' },
  { status: 'in_progress', label: 'In Production', description: 'Our team is working on your order' },
  { status: 'completed', label: 'Completed', description: 'Your results are ready' },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [files, setFiles] = useState<OrderFile[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchOrder = useCallback(async () => {
    const supabase = createClient()

    const [orderResult, filesResult] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_files').select('*').eq('order_id', orderId).order('created_at'),
    ])

    if (orderResult.error || !orderResult.data) {
      setNotFound(true)
    } else {
      setOrder(orderResult.data)
      setFiles(filesResult.data || [])
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('orders').delete().eq('id', orderId)
    router.push('/dashboard')
  }

  if (loading) return <PageLoader />

  if (notFound) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">Order not found</h2>
        <p className="text-text-muted mb-6">This order doesn&apos;t exist or you don&apos;t have access.</p>
        <Link href="/dashboard" className="btn-primary text-sm inline-block">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!order) return null

  const productFiles = files.filter(f => f.file_type === 'product_photo')
  const poseFiles = files.filter(f => f.file_type === 'pose_reference')
  const resultFiles = files.filter(f => f.file_type === 'result')

  const currentStepIndex = order.status === 'cancelled'
    ? -1
    : STATUS_TIMELINE.findIndex(s => s.status === order.status)

  return (
    <div className="page-container max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-text-secondary transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-secondary truncate">{order.product_name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl font-semibold text-text-primary">{order.product_name}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-text-muted text-sm">
            Order #{order.id.slice(0, 8).toUpperCase()} · Created {formatDateTime(order.created_at)}
          </p>
        </div>

        {order.status === 'pending' && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/orders/${order.id}/edit`} className="btn-secondary text-sm px-4 py-2">
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger text-sm px-4 py-2"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="card">
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-5">Order Details</h2>
            <div className="space-y-4">
              <DetailRow label="Photos Requested" value={`${order.photo_count} photo${order.photo_count !== 1 ? 's' : ''}`} />
              <DetailRow
                label="Style Direction"
                value={
                  order.style_direction === 'other' && order.style_direction_custom
                    ? `Other — ${order.style_direction_custom}`
                    : getStyleDirectionLabel(order.style_direction)
                }
              />
              <DetailRow
                label="Express Delivery"
                value={order.extra_fast_delivery ? '⚡ Yes (24h)' : 'Standard'}
                valueClass={order.extra_fast_delivery ? 'text-accent' : ''}
              />
              {order.description && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-text-primary leading-relaxed bg-surface rounded-[8px] p-4 border border-[#2E2E2E]">
                    {order.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Files */}
          {productFiles.length > 0 && (
            <div className="card">
              <FileViewer files={productFiles} title="Product Photos" />
            </div>
          )}

          {/* Pose References */}
          {poseFiles.length > 0 && (
            <div className="card">
              <FileViewer files={poseFiles} title="Pose References" />
            </div>
          )}

          {/* Result Files */}
          {resultFiles.length > 0 && (
            <div className="card border-accent/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <h3 className="font-serif text-xl font-semibold text-accent">Your Results</h3>
              </div>
              <p className="text-sm text-text-muted mb-4">
                Your production results are ready. Download or preview below.
              </p>
              <FileViewer files={resultFiles} title="Result Files" bucket="order-results" />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-5 text-sm uppercase tracking-wide">
              Order Progress
            </h3>

            {order.status === 'cancelled' ? (
              <div className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-status-cancelled/15 border border-status-cancelled/30 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-status-cancelled" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-status-cancelled">Order Cancelled</p>
                  <p className="text-xs text-text-muted">This order has been cancelled</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {STATUS_TIMELINE.map((step, index) => {
                  const isCompleted = index < currentStepIndex
                  const isCurrent = index === currentStepIndex
                  const isPending = index > currentStepIndex

                  return (
                    <div key={step.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0
                          ${isCompleted ? 'border-accent bg-accent' : ''}
                          ${isCurrent ? 'border-accent bg-accent/15' : ''}
                          ${isPending ? 'border-[#2E2E2E] bg-surface' : ''}
                        `}>
                          {isCompleted ? (
                            <svg className="w-3.5 h-3.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : isCurrent ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-[#2E2E2E]" />
                          )}
                        </div>
                        {index < STATUS_TIMELINE.length - 1 && (
                          <div className={`w-0.5 h-6 my-0.5 ${isCompleted ? 'bg-accent/40' : 'bg-[#2E2E2E]'}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-accent' : isCompleted ? 'text-text-primary' : 'text-text-muted'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-text-muted">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">
              Timestamps
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Created</p>
                <p className="text-sm text-text-primary">{formatDateTime(order.created_at)}</p>
              </div>
              {order.updated_at !== order.created_at && (
                <div>
                  <p className="text-xs text-text-muted">Last Updated</p>
                  <p className="text-sm text-text-primary">{formatDateTime(order.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Order"
        message={`Are you sure you want to delete "${order.product_name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete Order'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
  valueClass = '',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-start gap-4">
      <p className="text-xs text-text-muted uppercase tracking-wide w-36 shrink-0 pt-0.5">{label}</p>
      <p className={`text-sm text-text-primary font-medium flex-1 ${valueClass}`}>{value}</p>
    </div>
  )
}
