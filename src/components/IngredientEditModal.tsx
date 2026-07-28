import { useState, useRef, type ChangeEvent } from 'react'
import axios from 'axios'
import { uploadImage } from '../services/api'
import type { Ingredient } from '../types/recipe'

const UNITS = ['g', 'ml', 'kg', 'L', 'pack', 'piece']

interface Draft {
  name: string
  price: string
  weight: { value: string; unit: string }
  image: string
}

interface IngredientEditModalProps {
  ingredient: Partial<Ingredient> & { name: string }
  onSave: (draft: Partial<Ingredient>) => Promise<void>
  onCancel: () => void
}

export default function IngredientEditModal({ ingredient, onSave, onCancel }: IngredientEditModalProps) {
  const [draft, setDraft] = useState<Draft>({
    name: ingredient.name,
    price: String(ingredient.price ?? 0),
    weight: { value: String(ingredient.weight?.value ?? 0), unit: ingredient.weight?.unit ?? 'g' },
    image: ingredient.image ?? '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  const busy = uploading || saving

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setDraft((d) => ({ ...d, image: url }))
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined
      alert(`Upload failed: ${message || (err as Error).message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...draft,
        price: Number(draft.price) || 0,
        weight: { ...draft.weight, value: Number(draft.weight.value) || 0 },
      })
    } catch {
      alert('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const btnLabel = saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-10 min-h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} disabled={busy} className="text-sm text-gray-500 px-3 py-1 border border-gray-300 rounded disabled:opacity-40">
            Cancel
          </button>
          <span className="font-semibold text-gray-800 text-sm truncate mx-3">{draft.name}</span>
          <button onClick={handleSave} disabled={busy} className="text-sm bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50">
            {btnLabel}
          </button>
        </div>

        {/* Image */}
        <div
          className="relative mb-4 cursor-pointer group"
          onClick={() => !busy && imgRef.current?.click()}
        >
          {draft.image ? (
            <img src={draft.image} alt={draft.name} className="w-full h-56 object-cover rounded-xl" />
          ) : (
            <div className="w-full h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-white text-sm font-medium">📷 Change Image</span>
          </div>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Price & package */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Price (฿)</label>
            <input
              type="number"
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Package size</label>
            <input
              type="number"
              value={draft.weight.value}
              onChange={(e) => setDraft((d) => ({ ...d, weight: { ...d.weight, value: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-gray-500 mb-1 block">Unit</label>
            <select
              value={draft.weight.unit}
              onChange={(e) => setDraft((d) => ({ ...d, weight: { ...d.weight, unit: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
