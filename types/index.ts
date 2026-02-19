export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type StyleDirection = 'studio' | 'lifestyle' | 'street' | 'other'
export type FileType = 'product_photo' | 'pose_reference' | 'result'
export type UploadedBy = 'client' | 'admin'

export interface Order {
  id: string
  user_id: string
  product_name: string
  description: string | null
  photo_count: number
  style_direction: StyleDirection
  style_direction_custom: string | null
  extra_fast_delivery: boolean
  status: OrderStatus
  created_at: string
  updated_at: string
  // Joined fields
  user_email?: string
}

export interface OrderFile {
  id: string
  order_id: string
  file_url: string
  file_name: string
  file_type: FileType
  uploaded_by: UploadedBy
  created_at: string
  // Runtime field for signed URL
  signed_url?: string
}

export interface OrderWithFiles extends Order {
  order_files: OrderFile[]
}

export interface CreateOrderInput {
  product_name: string
  description: string
  photo_count: number
  style_direction: StyleDirection
  style_direction_custom?: string
  extra_fast_delivery: boolean
}

export interface UpdateOrderInput extends Partial<CreateOrderInput> {
  status?: OrderStatus
}
