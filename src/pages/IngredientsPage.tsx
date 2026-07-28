import { useState } from 'react'
import ImageWithLoader from '../components/ImageWithLoader'
import IngredientForm from '../components/IngredientForm'
import type { Ingredient, IngredientDraft } from '../types/recipe'

interface IngredientsPageProps {
  query: string
  onImage: (url: string) => void
  ingredients: Ingredient[]
  onSave: (draft: IngredientDraft) => Promise<Ingredient>
  onDelete: (id: string) => Promise<void>
}

export default function IngredientsPage({ query, onImage, ingredients, onSave, onDelete }: IngredientsPageProps) {
  const [addMode, setAddMode] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)

  const handleSave = async (draft: IngredientDraft) => {
    await onSave(draft)
    setAddMode(false)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!editing) return
    await onDelete(editing._id)
    setEditing(null)
  }

  if (addMode) {
    return (
      <IngredientForm
        ingredient={null}
        onSave={handleSave}
        onCancel={() => setAddMode(false)}
      />
    )
  }

  if (editing) {
    return (
      <IngredientForm
        ingredient={editing}
        onSave={(draft) => handleSave({ ...draft, _id: editing._id })}
        onDelete={handleDelete}
        onCancel={() => setEditing(null)}
      />
    )
  }

  const lcQuery = query.toLowerCase().trim()
  const visible = ingredients
    .filter((i) => (lcQuery ? i.name.toLowerCase().includes(lcQuery) : true))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="animate-fade-slide-in">
      <button
        onClick={() => setAddMode(true)}
        className="w-full border-2 border-dashed border-gray-600 text-gray-400 py-2 rounded-lg text-sm hover:border-gray-500 hover:text-gray-300 mt-2 mb-3 transition-colors"
      >
        + Add Ingredient
      </button>

      {visible.length === 0 ? (
        <p className="text-center text-gray-400 text-sm mt-10">
          {query ? `No ingredients found for "${query}"` : 'No ingredients yet'}
        </p>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {visible.map((ing, j) => (
            <div
              key={ing._id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-700 ${j !== 0 ? 'border-t border-gray-700' : ''}`}
              onClick={() => setEditing(ing)}
            >
              <div onClick={(e) => { if (ing.image) { e.stopPropagation(); onImage(ing.image) } }} className="shrink-0">
                <ImageWithLoader
                  src={ing.image}
                  alt={ing.name}
                  wrapperClass="w-10 h-10 rounded-lg"
                  imgClass="w-10 h-10 object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-200">{ing.name}</span>
                <p className="text-xs text-gray-400 truncate">
                  {ing.qty} {ing.unit}{ing.supplier ? ` · ${ing.supplier}` : ''}
                </p>
              </div>
              <span className={`text-xs font-semibold shrink-0 ${ing.price > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                S${ing.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
