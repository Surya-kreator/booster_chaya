export type AdminCategory = {
  id: number
  name: string
}

export type AdminMenuItem = {
  id: number | string
  name: string
  description: string | null
  price: number
  available: boolean
  category: number
  image_url: string | null
}

export type ItemFormValues = {
  name: string
  description: string
  price: number
  categoryId: number
  available: boolean
  imageFile: File | null
}
