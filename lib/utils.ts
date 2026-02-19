import { OrderStatus } from '@/types'

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#737373',
    in_progress: '#EAB308',
    completed: '#4ADE80',
    cancelled: '#EF4444',
  }
  return colors[status]
}

export function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

export function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getStyleDirectionLabel(style: string): string {
  const labels: Record<string, string> = {
    studio: 'Studio',
    lifestyle: 'Lifestyle',
    street: 'Street',
    other: 'Other',
  }
  return labels[style] || style
}
