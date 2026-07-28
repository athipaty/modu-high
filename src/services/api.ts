import axios from 'axios'
import type { Recipe, RecipeDraft, Ingredient, IngredientDraft } from '../types/recipe'

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

export async function createIngredient(ingredient: IngredientDraft): Promise<Ingredient> {
  const { data } = await api.post('/ingredients', ingredient)
  return data
}

export async function updateIngredient(id: string, ingredient: IngredientDraft): Promise<Ingredient> {
  const { data } = await api.put(`/ingredients/${id}`, ingredient)
  return data
}

export async function deleteIngredient(id: string): Promise<void> {
  await api.delete(`/ingredients/${id}`)
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const { data } = await api.post('/recipes/upload-image', form)
  return data.url
}
