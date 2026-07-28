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
  knownUnits?: Record<string, string>
  knownNames?: string[]
}

type Status = '' | 'uploading' | 'saving'

export default function EditRecipeForm({ recipe, onSave, onCancel, knownImages = {}, knownUnits = {}, knownNames = [] }: EditRecipeFormProps) {
  const [draft, setDraft] = useState<Draft>(() => {
    const r = JSON.parse(JSON.stringify(recipe)) as RecipeDraft
    return {
      ...r,
      ingredients: r.ingredients.map((ing) => ({ ...ing, quantity: String(ing.quantity ?? '') })),
    }
  })
  const [status, setStatus] = useState<Status>('')

  const recipeImgRef = useRef<HTMLInputElement>(null)

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
        { item: '', quantity: '', unit: '', image: '' },
      ],
    }))

  const removeIng = (i: number) =>
    setDraft((d) => ({
      ...d,
      ingredients: d.ingredients.filter((_, idx) => idx !== i),
    }))

  // Typing is free-form (with datalist suggestions) since a ~100-item dropdown is hard to
  // browse — but on blur we require an exact (case-insensitive) match against the master
  // Ingredients list. A match pulls its image/unit straight from that master record (neither
  // is editable per-recipe); anything that doesn't match gets rejected with an alert.
  const nameByKey: Record<string, string> = {}
  knownNames.forEach((n) => { nameByKey[n.toLowerCase().trim()] = n })

  const onIngNameBlur = (i: number) => {
    const typed = draft.ingredients[i].item
    const key = typed.toLowerCase().trim()
    if (!key) return
    const canonical = nameByKey[key]
    if (!canonical) {
      alert(`"${typed}" is not on the ingredient master list. Please pick an existing ingredient, or add it in the Ingredients tab first.`)
      setDraft((d) => {
        const ings = [...d.ingredients]
        ings[i] = { ...ings[i], item: '', image: '', unit: '' }
        return { ...d, ingredients: ings }
      })
      return
    }
    setDraft((d) => {
      const ings = [...d.ingredients]
      ings[i] = {
        ...ings[i],
        item: canonical,
        image: knownImages[key] || '',
        unit: knownUnits[key] || '',
      }
      return { ...d, ingredients: ings }
    })
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

  const handleSave = async () => {
    if (draft.ingredients.some((ing) => !ing.item)) {
      alert('Please select an ingredient for every row, or remove empty rows.')
      return
    }
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
          className="text-sm text-gray-400 px-3 py-1 rounded border border-gray-600 disabled:opacity-40"
        >
          Cancel
        </button>
        <input
          value={draft.name}
          onChange={(e) => updateField('name', e.target.value)}
          autoComplete="off"
          className="flex-1 text-xl font-bold text-center text-gray-100 border-b-2 border-green-400 bg-transparent outline-none"
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
          <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-sm">
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
      {draft.ingredients.length > 0 && (
        <table className="w-full border border-gray-700 rounded-lg overflow-hidden bg-gray-800 mb-3 text-sm">
          <thead>
            <tr className="bg-gray-700 text-xs">
              <th className="px-2 py-2 border border-gray-600 text-left w-14 text-gray-200">Img</th>
              <th className="px-2 py-2 border border-gray-600 text-left text-gray-200">Ingredient</th>
              <th className="px-2 py-2 border border-gray-600 text-center w-16 text-gray-200">Qty</th>
              <th className="px-2 py-2 border border-gray-600 text-center w-10 text-gray-200">Unit</th>
              <th className="px-2 py-2 border border-gray-600 w-6"></th>
            </tr>
          </thead>
          <tbody>
            {draft.ingredients.map((ing, i) => (
              <tr key={i} className="odd:bg-gray-800 even:bg-gray-800/60">
                {/* Ingredient image — sourced from the master ingredient, not editable here */}
                <td className="border border-gray-700 px-1 py-1">
                  {ing.image ? (
                    <img
                      src={ing.image}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-lg">
                      📷
                    </div>
                  )}
                </td>

                {/* Item name — free-typing with suggestions, but only an exact match against
                    the master Ingredients list is accepted (validated/rejected on blur) */}
                <td className="border border-gray-700 px-1 py-1">
                  <input
                    value={ing.item}
                    onChange={(e) => updateIng(i, 'item', e.target.value)}
                    onBlur={() => onIngNameBlur(i)}
                    autoComplete="off"
                    list="known-ingredient-names"
                    placeholder="Type to search..."
                    className="w-full border border-gray-600 bg-gray-900 text-gray-100 rounded px-1 py-0.5 text-sm focus:ring-1 focus:ring-green-400 outline-none"
                  />
                </td>

                {/* Qty — how much this recipe uses, the only per-recipe field */}
                <td className="border border-gray-700 px-1 py-1">
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => updateIng(i, 'quantity', e.target.value)}
                    className="w-full border border-gray-600 bg-gray-900 text-gray-100 rounded px-1 py-0.5 text-sm text-center focus:ring-1 focus:ring-green-400 outline-none"
                  />
                </td>

                {/* Unit — sourced from the master ingredient, not editable here */}
                <td className="border border-gray-700 px-1 py-1 text-center text-xs text-gray-400">
                  {ing.unit || '—'}
                </td>

                {/* Delete */}
                <td className="border border-gray-700 px-1 py-1 text-center">
                  <button
                    onClick={() => removeIng(i)}
                    className="text-red-400 hover:text-red-300 text-xl leading-none"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <datalist id="known-ingredient-names">
        {knownNames.map((name) => <option key={name} value={name} />)}
      </datalist>

      {knownNames.length === 0 ? (
        <p className="text-center text-gray-500 text-xs mb-3 px-2">
          No ingredients on the master list yet — add some in the Ingredients tab first, then come back to build this recipe.
        </p>
      ) : (
        <button
          onClick={addIng}
          className="w-full border-2 border-dashed border-gray-600 text-gray-400 py-2 rounded-lg text-sm hover:border-gray-500 hover:text-gray-300 mb-3 transition-colors"
        >
          + Add Ingredient
        </button>
      )}

      {/* Method */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-200">Method</h3>
        <textarea
          value={draft.method || ''}
          onChange={(e) => updateField('method', e.target.value)}
          rows={6}
          className="w-full border border-gray-600 bg-gray-900 rounded px-2 py-1 text-sm text-gray-100 resize-y focus:outline-none focus:ring-1 focus:ring-green-400"
        />
      </div>
    </div>
  )
}
