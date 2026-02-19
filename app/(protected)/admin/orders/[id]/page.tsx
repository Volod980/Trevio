'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderFile, OrderStatus } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FileViewer } from '@/components/orders/FileViewer'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDateTime, getStyleDirectionLabel } from '@/lib/utils'

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [files, setFiles] = useState<OrderFile[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Status change
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending')
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusSaved, setStatusSaved] = useState(false)

  // Result files upload
  const [resultFiles, setResultFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

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
      setNewStatus(orderResult.data.status)
      setFiles(filesResult.data || [])
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleStatusChange = async () => {
    if (!order || newStatus === order.status) return
    setSavingStatus(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
      setStatusSaved(true)
      setTimeout(() => setStatusSaved(false), 3000)
    }
    setSavingStatus(false)
  }

  const handleUploadResults = async () => {
    if (!resultFiles.length || !order) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    const supabase = createClient()
    const newFileRecords = []

    try {
      for (const file of resultFiles) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const path = `${orderId}/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from('order-results')
          .upload(path, file)

        if (uploadErr) throw uploadErr

        newFileRecords.push({
          order_id: orderId,
          file_url: path,
          file_name: file.name,
          file_type: 'result' as const,
          uploaded_by: 'admin' as const,
        })
      }

      const { data: inserted, error: dbErr } = await supabase
        .from('order_files')
        .insert(newFileRecords)
        .select()

      if (dbErr) throw dbErr

      setFiles(prev => [...prev, ...(inserted || [])])
      setResultFiles([])
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)

      // Auto-update to completed if still in_progress
      if (order.status === 'in_progress') {
        setNewStatus('completed')
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  if (loading) return <PageLoader />

  if (notFound) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">Order not found</h2>
        <Link href="/admin" className="btn-primary text-sm inline-block mt-4">Back to Admin</Link>
      </div>
    )
  }

  if (!order) return null

  const productFiles = files.filter(f => f.file_type === 'product_photo')
  const poseFiles = files.filter(f => f.file_type === 'pose_reference')
  const existingResultFiles = files.filter(f => f.file_type === 'result')

  return (
    <div className="page-container max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <span className="text-xs font-semibold text-accent uppercase tracking-wider">Admin</span>
        <span>/</span>
        <Link href="/admin" className="hover:text-text-secondary transition-colors">Orders</Link>
        <span>/</span>
        <span className="text-text-secondary">#{order.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-3xl font-semibold text-text-primary">{order.product_name}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-text-muted text-sm">
            Order #{order.id.slice(0, 8).toUpperCase()} · {formatDateTime(order.created_at)}
          </p>
          <p className="text-xs text-text-muted mt-1">Client ID: {order.user_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="card">
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-5">Order Details</h2>
            <div className="space-y-4">
              <AdminDetailRow label="Photos" value={`${order.photo_count}`} />
              <AdminDetailRow
                label="Style"
                value={
                  order.style_direction === 'other' && order.style_direction_custom
                    ? `Other — ${order.style_direction_custom}`
                    : getStyleDirectionLabel(order.style_direction)
                }
              />
              <AdminDetailRow
                label="Express"
                value={order.extra_fast_delivery ? '⚡ Yes (24h)' : 'Standard'}
              />
              {order.description && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Description</p>
                  <p className="text-sm text-text-primary leading-relaxed bg-surface rounded-[8px] p-4 border border-[#2E2E2E] whitespace-pre-wrap">
                    {order.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Client Files */}
          {productFiles.length > 0 && (
            <div className="card">
              <FileViewer files={productFiles} title="Product Photos (from client)" />
            </div>
          )}

          {poseFiles.length > 0 && (
            <div className="card">
              <FileViewer files={poseFiles} title="Pose References (from client)" />
            </div>
          )}

          {/* Upload Results */}
          <div className="card border-accent/20">
            <h2 className="font-serif text-xl font-semibold text-text-primary mb-2">Upload Results</h2>
            <p className="text-sm text-text-muted mb-5">
              Upload the final production results for the client. Completed files will be visible in their order detail page.
            </p>

            <FileUploadZone
              label="Images or video files"
              accept="image/*,video/*"
              multiple
              maxSizeMB={10}
              files={resultFiles}
              onChange={setResultFiles}
            />

            {uploadError && (
              <p className="mt-3 text-sm text-status-cancelled">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="mt-3 text-sm text-accent">Results uploaded successfully!</p>
            )}

            {resultFiles.length > 0 && (
              <button
                onClick={handleUploadResults}
                disabled={uploading}
                className="btn-primary mt-4 text-sm flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Uploading {resultFiles.length} file{resultFiles.length !== 1 ? 's' : ''}...
                  </>
                ) : (
                  `Upload ${resultFiles.length} Result File${resultFiles.length !== 1 ? 's' : ''}`
                )}
              </button>
            )}
          </div>

          {/* Existing Results */}
          {existingResultFiles.length > 0 && (
            <div className="card">
              <FileViewer
                files={existingResultFiles}
                title="Uploaded Results"
                bucket="order-results"
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="card border-accent/20">
            <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">
              Change Status
            </h3>

            <div className="space-y-2 mb-4">
              {STATUS_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`
                    flex items-center gap-3 p-3 rounded-[8px] border cursor-pointer transition-all duration-200
                    ${newStatus === opt.value
                      ? 'border-accent/50 bg-accent/5'
                      : 'border-[#2E2E2E] bg-surface hover:border-[#3E3E3E]'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    checked={newStatus === opt.value}
                    onChange={() => setNewStatus(opt.value)}
                    className="absolute opacity-0 w-0 h-0"
                  />
                  <StatusBadge status={opt.value} size="sm" />
                </label>
              ))}
            </div>

            <button
              onClick={handleStatusChange}
              disabled={savingStatus || newStatus === order.status}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {savingStatus ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : statusSaved ? (
                '✓ Status Updated'
              ) : (
                'Update Status'
              )}
            </button>

            {newStatus === order.status && !savingStatus && (
              <p className="text-xs text-text-muted text-center mt-2">
                Select a different status to update
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4 text-sm uppercase tracking-wide">
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Created</p>
                <p className="text-sm text-text-primary">{formatDateTime(order.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Last Updated</p>
                <p className="text-sm text-text-primary">{formatDateTime(order.updated_at)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Files</p>
                <p className="text-sm text-text-primary">{files.length} total ({existingResultFiles.length} results)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <p className="text-xs text-text-muted uppercase tracking-wide w-24 shrink-0">{label}</p>
      <p className="text-sm text-text-primary font-medium">{value}</p>
    </div>
  )
}
