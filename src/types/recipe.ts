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
  createdAt?: string
  updatedAt?: string
}

export type RecipeDraft = Omit<Recipe, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }

export interface Ingredient {
  _id: string
  name: string
  image: string
  qty: number
  unit: string
  price: number
  supplier: string
  createdAt?: string
  updatedAt?: string
}

export type IngredientDraft = Omit<Ingredient, '_id' | 'createdAt' | 'updatedAt'> & { _id?: string }
