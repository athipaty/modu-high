const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
)

const IconBack = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconEdit = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)

const IconPlus = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

interface SearchBarProps {
  query: string
  onChange: (value: string) => void
  placeholder?: string
  onBack?: () => void
  showBack?: boolean
  onEdit?: () => void
  onAdd?: () => void
  onMenu?: () => void
}

export default function SearchBar({
  query,
  onChange,
  placeholder,
  onBack,
  showBack,
  onEdit,
  onAdd,
  onMenu,
}: SearchBarProps) {
  return (
    <div className="flex items-center justify-between mb-4 px-2 animate-fade-slide-in">
      {showBack ? (
        <button
          onClick={onBack}
          className="w-[44px] h-[44px] flex items-center justify-center text-gray-400 transition-transform duration-200 active:scale-90"
        >
          <IconBack />
        </button>
      ) : onMenu ? (
        <button
          onClick={onMenu}
          className="w-[44px] h-[44px] flex items-center justify-center text-gray-400 transition-transform duration-200 active:scale-90"
          title="Menu"
        >
          <IconMenu />
        </button>
      ) : (
        <div className="w-[44px]" />
      )}

      <input
        className="mx-2 p-3 border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-500 rounded text-center flex-grow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:shadow-md"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      {onEdit && (
        <button
          onClick={onEdit}
          className="w-[44px] h-[44px] flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors duration-200 active:scale-90"
          title="Edit recipe"
        >
          <IconEdit />
        </button>
      )}

      {onAdd && (
        <button
          onClick={onAdd}
          className="w-[44px] h-[44px] flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors duration-200 active:scale-90"
          title="Add new recipe"
        >
          <IconPlus />
        </button>
      )}

      {!onEdit && !onAdd && <div className="w-[44px]" />}
    </div>
  )
}
