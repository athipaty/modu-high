import { useState, useRef, type ChangeEvent } from 'react'
import axios from 'axios'
import { uploadImage } from '../services/api'
import type { RecipeDraft } from '../types/recipe'

interface DraftIngredient {
  item: string
  quantity: string
  unit: string
  image: string
}

interface Draft {
  _id?: string
  name: string
  image: string
  ingredients: DraftIngredient[]
  method: string
  active: boolean
}

interface EditRecipeFormProps {
  recipe: RecipeDraft
  onSave: (draft: RecipeDraft) => Promise<void>
  onCancel: () => void
  knownImages?: Record<string, string>
  knownNames?: string[]
}

type Status = '' | 'uploading' | 'saving'

export default function EditRecipeForm({ recipe, onSave, onCancel, knownImages = {}, knownNames = [] }: EditRecipeFormProps) {
  const [draft, setDraft] = useState<Draft>(() => {
    const r = JSON.parse(JSON.stringify(recipe)) as RecipeDraft
    return {
      ...r,
      ingredients: r.ingredients.map((ing) => ({ ...ing, quantity: String(ing.quantity ?? '') })),
    }
  })
  const [status, setStatus] = useState<Status>('')

  const recipeImgRef = useRef<HTMLInputElement>(null)
  const ingImgRefs = useRef<Record<number, HTMLInputElement | null>>({})

  function updateField<K extends keyof Draft>(field: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  function updateIng<K extends keyof DraftIngredient>(i: number, field: K, value: DraftIngredient[K]) {
    setDraft((d) => {
      const ings = [...d.ingredients]
      ings[i] = { ...ings[i], [field]: value }
      return { ...d, ingredients: ings }
    })
  }

  const addIng = () =>
    setDraft((d) => ({
      ...d,
      ingredients: [
        ...d.ingredients,
        { item: '', quantity: '', unit: 'g', image: '' },
      ],
    }))

  const removeIng = (i: number) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.filter((_, idx) => idx !== i),
    }))

  const onIngNameBlur = (i: number) => {
    const ing = draft.ingredients[i]
    if (ing.image) return // never overwrite an image already set
    const match = knownImages[(ing.item || '').toLowerCase().trim()]
    if (match) updateIng(i, 'image', match)
  }

  const handleRecipeImgChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading')
    try {
      const url = await uploadImage(file)
      updateField('image', url)
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      alert(`Upload failed: ${message || (err as Error).message}`)
    } finally {
      setStatus('')
      e.target.value = ''
    }
  }

  const handleIngImgChange = async (e: ChangeEvent<HTMLInputElement>, i: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading')
    try {
      const url = await uploadImage(file)
      updateIng(i, 'image', url)
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      alert(`Upload failed: ${message || (err as Error).message}`)
    } finally {
      setStatus('')
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setStatus('saving')
    try {
      const toSave: RecipeDraft = {
        ...draft,
        ingredients: draft.ingredients.map((ing) => ({
          ...ing,
          quantity: Number(ing.quantity) || 0,
        })),
      }
      await onSave(toSave)
    } catch {
      alert('Failed to save. Please try again.')
      setStatus('')
    }
  }

  const busy = status !== ''
  const btnLabel = status === 'saving'
    ? 'Saving...'
    : status === 'uploading'
    ? 'Uploading...'
    : 'Save'

  return (
    <div className="pb-6">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onCancel}
          disabled={busy}
          className="text-sm text-gray-500 px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
        >
          Cancel
        </button>
        <input
          value={draft.name}
          onChange={(e) => updateField('name', e.target.value)}
          autoComplete="off"
          className="flex-1 text-xl font-bold text-center border-b-2 border-green-400 bg-transparent outline-none"
        />
        <button
          onClick={handleSave}
          disabled={busy}
          className="text-sm bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {btnLabel}
        </button>
      </div>

      {/* Recipe image */}
      <div className="relative mb-3 group cursor-pointer" onClick={() => !busy && recipeImgRef.current?.click()}>
        {draft.image ? (
          <img
            src={draft.image}
            alt={draft.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          📷 Change Image
        </div>
        <input
          ref={recipeImgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleRecipeImgChange}
        />
      </div>

      {/* Ingredients table */}
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white mb-3 text-sm">
        <thead>
          <tr className="bg-gray-100 text-xs">
            <th className="px-2 py-2 border text-left w-14">Img</th>
            <th className="px-2 py-2 border text-left">Ingredient</th>
            <th className="px-2 py-2 border text-center w-16">Qty</th>
            <th className="px-2 py-2 border text-center w-10">Unit</th>
            <th className="px-2 py-2 border w-6"></th>
          </tr>
        </thead>
        <tbody>
          {draft.ingredients.map((ing, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {/* Ingredient image */}
              <td className="border px-1 py-1">
                <div
                  className="relative w-12 h-12 cursor-pointer group/img"
                  onClick={() => !busy && ingImgRefs.current[i]?.click()}
                >
                  {ing.image ? (
                    <img
                      src={ing.image}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-lg">
                      📷
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 rounded opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs">📷</span>
                  </div>
                  <input
                    ref={(el) => { ingImgRefs.current[i] = el }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleIngImgChange(e, i)}
                  />
                </div>
              </td>

              {/* Item name */}
              <td className="border px-1 py-1">
                <input
                  value={ing.item}
                  onChange={(e) => updateIng(i, 'item', e.target.value)}
                  onBlur={() => onIngNameBlur(i)}
                  autoComplete="off"
                  list="known-ingredient-names"
                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-green-400 outline-none"
                />
              </td>

              {/* Qty */}
              <td className="border px-1 py-1">
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={(e) => updateIng(i, 'quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-sm text-center focus:ring-1 focus:ring-green-400 outline-none"
                />
              </td>

              {/* Unit */}
              <td className="border px-1 py-1">
                <input
                  value={ing.unit}
                  onChange={(e) => updateIng(i, 'unit', e.target.value)}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded px-1 py-0.5 text-xs text-center focus:ring-1 focus:ring-green-400 outline-none"
                />
              </td>

              {/* Delete */}
              <td className="border px-1 py-1 text-center">
                <button
                  onClick={() => removeIng(i)}
                  className="text-red-400 hover:text-red-600 text-xl leading-none"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <datalist id="known-ingredient-names">
        {knownNames.map((name) => <option key={name} value={name} />)}
      </datalist>

      <button
        onClick={addIng}
        className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-2 rounded-lg text-sm hover:border-gray-400 hover:text-gray-500 mb-3 transition-colors"
      >
        + Add Ingredient
      </button>

      {/* Method */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">Method</h3>
        <textarea
          value={draft.method || ''}
          onChange={(e) => updateField('method', e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 resize-y focus:outline-none focus:ring-1 focus:ring-green-400"
        />
      </div>
    </div>
  )
}
