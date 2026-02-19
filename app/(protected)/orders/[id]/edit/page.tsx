'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Order, StyleDirection } from '@/types'
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner'

const STYLE_OPTIONS: { value: StyleDirection; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'street', label: 'Street' },
  { value: 'other', label: 'Other' },
]

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notAllowed, setNotAllowed] = useState(false)

  // Form state
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [photoCount, setPhotoCount] = useState('')
  const [styleDirection, setStyleDirection] = useState<StyleDirection>('studio')
  const [styleCustom, setStyleCustom] = useState('')
  const [extraFast, setExtraFast] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchOrder = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !data) {
      setNotAllowed(true)
    } else if (data.status !== 'pending') {
      setNotAllowed(true)
    } else {
      setOrder(data)
      setProductName(data.product_name)
      setDescription(data.description || '')
      setPhotoCount(String(data.photo_count))
      setStyleDirection(data.style_direction)
      setStyleCustom(data.style_direction_custom || '')
      setExtraFast(data.extra_fast_delivery)
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!productName.trim()) newErrors.productName = 'Product name is required'
    if (!photoCount || parseInt(photoCount) < 1) newErrors.photoCount = 'Enter a valid number'
    if (!description.trim()) newErrors.description = 'Description is required'
    if (styleDirection === 'other' && !styleCustom.trim()) newErrors.styleCustom = 'Please describe your style direction'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        product_name: productName.trim(),
        description: description.trim(),
        photo_count: parseInt(photoCount),
        style_direction: styleDirection,
        style_direction_custom: styleDirection === 'other' ? styleCustom.trim() : null,
        extra_fast_delivery: extraFast,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/orders/${orderId}`)
  }

  if (loading) return <PageLoader />

  if (notAllowed) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="font-serif text-2xl font-semibold text-text-primary mb-2">Cannot edit this order</h2>
        <p className="text-text-muted mb-6 text-sm">Only pending orders can be edited.</p>
        <Link href={`/orders/${orderId}`} className="btn-primary text-sm inline-block">
          View Order
        </Link>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="page-container max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-text-secondary transition-colors">Dashboard</Link>
        <span>/</span>
        <Link href={`/orders/${orderId}`} className="hover:text-text-secondary transition-colors truncate max-w-[200px]">
          {order.product_name}
        </Link>
        <span>/</span>
        <span className="text-text-secondary">Edit</span>
      </div>

      <div className="mb-8">
        <h1 className="section-title mb-1">Edit Order</h1>
        <p className="text-text-muted text-sm">Update the details of your order (only available while pending)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="card">
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 pb-4 border-b border-[#2E2E2E]">
            Product Details
          </h2>
          <div className="space-y-6">
            <div>
              <label className="label" htmlFor="product-name">
                Product Name <span className="text-status-cancelled">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                className={`input-field ${errors.productName ? 'border-status-cancelled/50' : ''}`}
                placeholder="e.g. Nike Air Max 90"
              />
              {errors.productName && <p className="mt-1.5 text-xs text-status-cancelled">{errors.productName}</p>}
            </div>

            <div>
              <label className="label" htmlFor="photo-count">
                How many photos? <span className="text-status-cancelled">*</span>
              </label>
              <input
                id="photo-count"
                type="number"
                min="1"
                max="500"
                value={photoCount}
                onChange={e => setPhotoCount(e.target.value)}
                className={`input-field max-w-xs ${errors.photoCount ? 'border-status-cancelled/50' : ''}`}
              />
              {errors.photoCount && <p className="mt-1.5 text-xs text-status-cancelled">{errors.photoCount}</p>}
            </div>

            <div>
              <label className="label" htmlFor="description">
                Description <span className="text-status-cancelled">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className={`input-field resize-none ${errors.description ? 'border-status-cancelled/50' : ''}`}
                placeholder="Describe your order requirements..."
              />
              {errors.description && <p className="mt-1.5 text-xs text-status-cancelled">{errors.description}</p>}
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 pb-4 border-b border-[#2E2E2E]">
            Style & Delivery
          </h2>
          <div className="space-y-6">
            <div>
              <p className="label">Style Direction <span className="text-status-cancelled">*</span></p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {STYLE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`
                      flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition-all duration-200
                      ${styleDirection === opt.value
                        ? 'border-accent bg-accent/5'
                        : 'border-[#2E2E2E] bg-surface hover:border-[#3E3E3E]'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="styleDirection"
                      value={opt.value}
                      checked={styleDirection === opt.value}
                      onChange={() => setStyleDirection(opt.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <span className={`text-sm font-medium ${styleDirection === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
              {styleDirection === 'other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={styleCustom}
                    onChange={e => setStyleCustom(e.target.value)}
                    className={`input-field ${errors.styleCustom ? 'border-status-cancelled/50' : ''}`}
                    placeholder="Describe your custom style direction..."
                  />
                  {errors.styleCustom && <p className="mt-1.5 text-xs text-status-cancelled">{errors.styleCustom}</p>}
                </div>
              )}
            </div>

            <div>
              <p className="label">Extra Fast Delivery (24h)</p>
              <p className="text-xs text-text-muted italic mb-3">
                Note that it would cost additional fees for express delivery
              </p>
              <div className="flex gap-3">
                {[
                  { value: true, label: '⚡ Yes, express delivery' },
                  { value: false, label: '📅 Standard delivery' },
                ].map(opt => (
                  <label
                    key={String(opt.value)}
                    className={`
                      flex-1 flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition-all duration-200
                      ${extraFast === opt.value
                        ? 'border-accent bg-accent/5'
                        : 'border-[#2E2E2E] bg-surface hover:border-[#3E3E3E]'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="extraFast"
                      checked={extraFast === opt.value}
                      onChange={() => setExtraFast(opt.value)}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <span className={`text-sm font-medium ${extraFast === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-status-cancelled/10 border border-status-cancelled/20 rounded-[12px] px-4 py-3">
            <p className="text-status-cancelled text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/orders/${orderId}`} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
