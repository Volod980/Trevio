'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderFile } from '@/types'
import { isImageFile, isVideoFile } from '@/lib/utils'

interface FileViewerProps {
  files: OrderFile[]
  title: string
  bucket?: string
}

export function FileViewer({ files, title, bucket = 'order-uploads' }: FileViewerProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (files.length === 0) {
      setLoading(false)
      return
    }

    const fetchSignedUrls = async () => {
      const supabase = createClient()
      const urls: Record<string, string> = {}

      for (const file of files) {
        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrl(file.file_url, 3600) // 1 hour expiry
        if (data?.signedUrl) {
          urls[file.id] = data.signedUrl
        }
      }

      setSignedUrls(urls)
      setLoading(false)
    }

    fetchSignedUrls()
  }, [files, bucket])

  if (files.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        {title} ({files.length})
      </h3>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map(file => (
            <div key={file.id} className="aspect-square rounded-[8px] bg-surface animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              signedUrl={signedUrls[file.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileItem({ file, signedUrl }: { file: OrderFile; signedUrl?: string }) {
  const isImage = isImageFile(file.file_name)
  const isVideo = isVideoFile(file.file_name)

  return (
    <div className="relative bg-surface rounded-[8px] border border-[#2E2E2E] overflow-hidden group">
      {isImage && signedUrl ? (
        <div className="aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signedUrl}
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square flex flex-col items-center justify-center p-3 gap-2">
          <svg className="w-10 h-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isVideo ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            )}
          </svg>
          <p className="text-xs text-text-muted text-center line-clamp-2 px-1">{file.file_name}</p>
        </div>
      )}

      {/* Hover overlay with download */}
      {signedUrl && (
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a
            href={signedUrl}
            download={file.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center hover:bg-accent-dark transition-colors"
            title="Download"
          >
            <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          {isImage && (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-surface border border-[#2E2E2E] flex items-center justify-center hover:border-accent/50 transition-colors"
              title="View full size"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* File name tooltip */}
      <div className="px-2 py-1 bg-background/90 border-t border-[#2E2E2E]">
        <p className="text-[10px] text-text-muted truncate">{file.file_name}</p>
      </div>
    </div>
  )
}
