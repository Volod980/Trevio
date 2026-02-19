'use client'

import { useCallback, useState } from 'react'
import { isImageFile, isVideoFile, formatFileSize } from '@/lib/utils'

interface FileUploadZoneProps {
  label: string
  accept?: string
  multiple?: boolean
  maxSizeMB?: number
  files: File[]
  onChange: (files: File[]) => void
  error?: string
}

export function FileUploadZone({
  label,
  accept = 'image/*,video/*',
  multiple = false,
  maxSizeMB = 10,
  files,
  onChange,
  error,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const validateAndAdd = useCallback(
    (newFiles: File[]) => {
      setSizeError(null)
      const maxBytes = maxSizeMB * 1024 * 1024
      const oversized = newFiles.filter(f => f.size > maxBytes)
      if (oversized.length > 0) {
        setSizeError(`Some files exceed the ${maxSizeMB}MB limit and were not added.`)
        newFiles = newFiles.filter(f => f.size <= maxBytes)
      }
      if (multiple) {
        const combined = [...files, ...newFiles]
        onChange(combined)
      } else {
        onChange(newFiles.slice(0, 1))
      }
    },
    [files, multiple, onChange, maxSizeMB]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      validateAndAdd(droppedFiles)
    },
    [validateAndAdd]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        validateAndAdd(Array.from(e.target.files))
        e.target.value = '' // Reset so same file can be selected again
      }
    },
    [validateAndAdd]
  )

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* Drop Zone */}
      <label
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center w-full h-36 rounded-[12px] cursor-pointer
          border-2 border-dashed transition-all duration-200
          ${isDragging
            ? 'border-accent bg-accent/5'
            : 'border-[#2E2E2E] bg-surface hover:border-accent/40 hover:bg-surface/80'
          }
          ${error ? 'border-status-cancelled/50' : ''}
        `}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <svg className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              <span className="text-accent font-medium">Click to upload</span> or drag & drop
            </p>
            <p className="text-xs text-text-muted mt-1">
              {label} · Max {maxSizeMB}MB{multiple ? ' each' : ''}
            </p>
          </div>
        </div>
      </label>

      {/* Error messages */}
      {(error || sizeError) && (
        <p className="mt-1.5 text-xs text-status-cancelled">
          {error || sizeError}
        </p>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file, index) => (
            <FilePreviewItem
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilePreviewItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string | null>(null)

  if (isImageFile(file.name) && !preview) {
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative bg-surface rounded-[8px] border border-[#2E2E2E] overflow-hidden group">
      {isImageFile(file.name) && preview ? (
        <div className="aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square flex flex-col items-center justify-center p-3 gap-1">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isVideoFile(file.name) ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            )}
          </svg>
          <p className="text-[10px] text-text-muted text-center truncate w-full px-1">
            {file.name}
          </p>
        </div>
      )}

      {/* File size */}
      <div className="px-2 py-1 bg-background/80 border-t border-[#2E2E2E]">
        <p className="text-[10px] text-text-muted truncate">{formatFileSize(file.size)}</p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background/90 border border-[#2E2E2E] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-status-cancelled hover:text-status-cancelled text-text-muted"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
