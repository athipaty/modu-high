import axios from 'axios'
import type { Recipe, RecipeDraft, Ingredient } from '../types/recipe'

const BASE = import.meta.env.VITE_API_URL || '/api/modu-high'

export const api = axios.create({ baseURL: BASE })

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data } = await api.get('/recipes')
  return data
}

export async function createRecipe(recipe: RecipeDraft): Promise<Recipe> {
  const { data } = await api.post('/recipes', recipe)
  return data
}

export async function updateRecipe(id: string, recipe: RecipeDraft): Promise<Recipe> {
  const { data } = await api.put(`/recipes/${id}`, recipe)
  return data
}

export async function fetchIngredients(): Promise<Ingredient[]> {
  const { data } = await api.get('/ingredients')
  return data
}

export async function saveIngredient(ingredient: Partial<Ingredient>): Promise<Ingredient> {
  const { data } = await api.post('/ingredients', ingredient)
  return data
}

export async function fetchInventoryFilter(): Promise<string[]> {
  const { data } = await api.get('/inventory-filter')
  return data
}

export async function saveInventoryFilter(excluded: string[]): Promise<string[]> {
  const { data } = await api.put('/inventory-filter', { excluded })
  return data
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/recipes/upload-image', form)
  return data.url
}
