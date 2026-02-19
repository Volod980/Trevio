'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StyleDirection } from '@/types'
import { FileUploadZone } from '@/components/ui/FileUploadZone'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const STYLE_OPTIONS: { value: StyleDirection; label: string; description: string }[] = [
  { value: 'studio', label: 'Studio', description: 'Clean background, controlled lighting' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'Natural settings, everyday contexts' },
  { value: 'street', label: 'Street', description: 'Urban environments, outdoor scenes' },
  { value: 'other', label: 'Other', description: 'Custom style direction' },
]

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [photoCount, setPhotoCount] = useState('')
  const [styleDirection, setStyleDirection] = useState<StyleDirection>('studio')
  const [styleCustom, setStyleCustom] = useState('')
  const [extraFast, setExtraFast] = useState<boolean | null>(null)
  const [productFiles, setProductFiles] = useState<File[]>([])
  const [poseFiles, setPoseFiles] = useState<File[]>([])

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!productName.trim()) newErrors.productName = 'Product name is required'
    if (!productFiles.length) newErrors.productFiles = 'At least one product photo is required'
    if (!photoCount || parseInt(photoCount) < 1) newErrors.photoCount = 'Please enter a valid number of photos'
    if (!description.trim()) newErrors.description = 'Description is required'
    if (styleDirection === 'other' && !styleCustom.trim()) newErrors.styleCustom = 'Please describe your style direction'
    if (!poseFiles.length) newErrors.poseFiles = 'Pose reference is required'
    if (extraFast === null) newErrors.extraFast = 'Please select delivery option'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const uploadFiles = async (files: File[], orderId: string, fileType: 'product_photo' | 'pose_reference') => {
    const supabase = createClient()
    const uploadedFiles = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `${orderId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('order-uploads')
        .upload(path, file)

      if (uploadError) throw uploadError

      uploadedFiles.push({
        order_id: orderId,
        file_url: path,
        file_name: file.name,
        file_type: fileType,
        uploaded_by: 'client' as const,
      })
    }

    return uploadedFiles
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_name: productName.trim(),
          description: description.trim(),
          photo_count: parseInt(photoCount),
          style_direction: styleDirection,
          style_direction_custom: styleDirection === 'other' ? styleCustom.trim() : null,
          extra_fast_delivery: extraFast === true,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Upload files
      const allFileInserts = [
        ...await uploadFiles(productFiles, order.id, 'product_photo'),
        ...await uploadFiles(poseFiles, order.id, 'pose_reference'),
      ]

      if (allFileInserts.length > 0) {
        const { error: filesError } = await supabase
          .from('order_files')
          .insert(allFileInserts)

        if (filesError) throw filesError
      }

      router.push(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-text-muted hover:text-text-secondary transition-colors flex items-center gap-1.5 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h1 className="section-title mb-1">New Order</h1>
        <p className="text-text-muted text-sm">Fill in the details for your photo production order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Product */}
        <section className="card">
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 pb-4 border-b border-[#2E2E2E]">
            Product Details
          </h2>
          <div className="space-y-6">
            {/* Product Name */}
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
                placeholder="e.g. Nike Air Max 90, Summer Dress, etc."
              />
              {errors.productName && <p className="mt-1.5 text-xs text-status-cancelled">{errors.productName}</p>}
            </div>

            {/* Product Photos */}
            <div>
              <label className="label">
                Product Photos <span className="text-status-cancelled">*</span>
              </label>
              <p className="text-xs text-text-muted mb-3">Upload photos of your product for reference</p>
              <FileUploadZone
                label="JPG, PNG, WEBP"
                accept="image/*"
                multiple
                maxSizeMB={10}
                files={productFiles}
                onChange={setProductFiles}
                error={errors.productFiles}
              />
            </div>

            {/* Photo Count */}
            <div>
              <label className="label" htmlFor="photo-count">
                How many photos do you need? <span className="text-status-cancelled">*</span>
              </label>
              <input
                id="photo-count"
                type="number"
                min="1"
                max="500"
                value={photoCount}
                onChange={e => setPhotoCount(e.target.value)}
                className={`input-field max-w-xs ${errors.photoCount ? 'border-status-cancelled/50' : ''}`}
                placeholder="e.g. 10"
              />
              {errors.photoCount && <p className="mt-1.5 text-xs text-status-cancelled">{errors.photoCount}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="label" htmlFor="description">
                Order Description <span className="text-status-cancelled">*</span>
              </label>
              <p className="text-xs text-text-muted mb-3">
                Describe your requirements, mood, specific details, or any other relevant information
              </p>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                className={`input-field resize-none ${errors.description ? 'border-status-cancelled/50' : ''}`}
                placeholder="Describe what you're looking for, any specific requirements, mood, colors, etc."
              />
              {errors.description && <p className="mt-1.5 text-xs text-status-cancelled">{errors.description}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Style */}
        <section className="card">
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 pb-4 border-b border-[#2E2E2E]">
            Style Direction
          </h2>
          <div className="space-y-6">
            {/* Style Direction */}
            <div>
              <p className="label">
                Select Style <span className="text-status-cancelled">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {STYLE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`
                      relative flex flex-col gap-1 p-4 rounded-[12px] border cursor-pointer transition-all duration-200
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
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${styleDirection === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                        {opt.label}
                      </span>
                      {styleDirection === opt.value && (
                        <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-background" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">{opt.description}</span>
                  </label>
                ))}
              </div>

              {styleDirection === 'other' && (
                <div className="mt-4">
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

            {/* Pose References */}
            <div>
              <label className="label">
                Pose / Reference Files <span className="text-status-cancelled">*</span>
              </label>
              <p className="text-xs text-text-muted mb-3">
                Upload images or videos showing pose preferences and visual direction
              </p>
              <FileUploadZone
                label="Images or video files"
                accept="image/*,video/*"
                multiple
                maxSizeMB={10}
                files={poseFiles}
                onChange={setPoseFiles}
                error={errors.poseFiles}
              />
            </div>
          </div>
        </section>

        {/* Section 3: Delivery */}
        <section className="card">
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-6 pb-4 border-b border-[#2E2E2E]">
            Delivery Options
          </h2>

          <div>
            <p className="label">
              Extra Fast Delivery (within 24h) <span className="text-status-cancelled">*</span>
            </p>
            <p className="text-xs text-text-muted italic mb-4">
              Note that it would cost additional fees for express delivery
            </p>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Yes, express delivery', icon: '⚡' },
                { value: false, label: 'Standard delivery', icon: '📅' },
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
                  <span className="text-lg">{opt.icon}</span>
                  <span className={`text-sm font-medium ${extraFast === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.extraFast && <p className="mt-1.5 text-xs text-status-cancelled">{errors.extraFast}</p>}
          </div>
        </section>

        {/* Submit */}
        {error && (
          <div className="bg-status-cancelled/10 border border-status-cancelled/20 rounded-[12px] px-4 py-3">
            <p className="text-status-cancelled text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating order...</span>
              </>
            ) : (
              'Submit Order'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
