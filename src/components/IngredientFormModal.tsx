import { useState, useRef, type ChangeEvent } from 'react'
import axios from 'axios'
import { uploadImage } from '../services/api'
import type { Ingredient, IngredientDraft } from '../types/recipe'

interface Draft {
  name: string
  image: string
  qty: string
  unit: string
  price: string
  supplier: string
}

interface IngredientFormModalProps {
  ingredient: Ingredient | null // null = creating a new one
  onSave: (draft: IngredientDraft) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

export default function IngredientFormModal({ ingredient, onSave, onDelete, onCancel }: IngredientFormModalProps) {
  const [draft, setDraft] = useState<Draft>({
    name: ingredient?.name ?? '',
    image: ingredient?.image ?? '',
    qty: String(ingredient?.qty ?? ''),
    unit: ingredient?.unit ?? 'g',
    price: String(ingredient?.price ?? ''),
    supplier: ingredient?.supplier ?? '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  const busy = uploading || saving || deleting

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
    if (!draft.name.trim()) {
      alert('Ingredient name is required')
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: draft.name.trim(),
        image: draft.image,
        qty: Number(draft.qty) || 0,
        unit: draft.unit,
        price: Number(draft.price) || 0,
        supplier: draft.supplier,
      })
    } catch {
      alert('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!confirm(`Delete "${draft.name}"?`)) return
    setDeleting(true)
    try {
      await onDelete()
    } catch {
      alert('Failed to delete. Please try again.')
      setDeleting(false)
    }
  }

  const saveLabel = saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onCancel} disabled={busy} className="text-sm text-gray-500 px-3 py-1 border border-gray-300 rounded disabled:opacity-40">
            Cancel
          </button>
          <span className="font-semibold text-gray-800 text-sm">{ingredient ? 'Edit Ingredient' : 'New Ingredient'}</span>
          <button onClick={handleSave} disabled={busy} className="text-sm bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50">
            {saveLabel}
          </button>
        </div>

        {/* Image */}
        <div
          className="relative mb-4 cursor-pointer group"
          onClick={() => !busy && imgRef.current?.click()}
        >
          {draft.image ? (
            <img src={draft.image} alt={draft.name} className="w-full h-40 object-cover rounded-xl" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
              No image
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-white text-sm font-medium">📷 Change Image</span>
          </div>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Name */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Ingredient name</label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>

        {/* Qty & unit */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Package qty</label>
            <input
              type="number"
              value={draft.qty}
              onChange={(e) => setDraft((d) => ({ ...d, qty: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div className="w-24">
            <label className="text-xs text-gray-500 mb-1 block">Unit</label>
            <input
              value={draft.unit}
              onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Price & supplier */}
        <div className="flex gap-3 mb-4">
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
            <label className="text-xs text-gray-500 mb-1 block">Supplier</label>
            <input
              value={draft.supplier}
              onChange={(e) => setDraft((d) => ({ ...d, supplier: e.target.value }))}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
            />
          </div>
        </div>

        {ingredient && onDelete && (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="w-full text-sm text-red-500 border border-red-200 rounded-lg py-2 hover:bg-red-50 disabled:opacity-40"
          >
            {deleting ? 'Deleting...' : 'Delete Ingredient'}
          </button>
        )}
      </div>
    </div>
  )
}
