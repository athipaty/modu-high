export interface RecipeIngredient {
  item: string
  quantity: number
  unit: string
  image: string
}

export interface Recipe {
  _id: string
  name: string
  image: string
  ingredients: RecipeIngredient[]
  method: string
  active: boolean
  type: 'sale' | 'staff'
  createdAt?: string
  updatedAt?: string
}

export type RecipeDraft = Omit<Recipe, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }

export interface Ingredient {
  _id: string
  name: string
  price: number
  weight: { value: number; unit: string }
  image: string
  stock: { value: number; unit: string }
  createdAt?: string
  updatedAt?: string
}
