import { useState } from 'react'

interface ImageWithLoaderProps {
  src: string
  alt?: string
  onClick?: () => void
  wrapperClass?: string
  imgClass?: string
  loading?: 'lazy' | 'eager'
  rounded?: string
}

export default function ImageWithLoader({
  src,
  alt = '',
  onClick,
  wrapperClass = '',
  imgClass = '',
  loading = 'lazy',
  rounded = 'rounded',
}: ImageWithLoaderProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // An empty src (no image uploaded yet) never fires the <img> load/error events reliably,
  // which left the loading spinner spinning forever — show a plain "no image" state instead.
  if (!src) {
    return (
      <div
        className={`relative overflow-hidden ${rounded} ${wrapperClass} bg-gray-700 flex items-center justify-center ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `Open ${alt}` : undefined}
      >
        <span className="text-gray-500 text-xs text-center px-1">No image</span>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${rounded} ${wrapperClass} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `Open ${alt}` : undefined}
    >
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse" />
      )}

      {/* Spinner */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 bg-gray-700">
          Image unavailable
        </div>
      )}

      {/* Image */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            ${imgClass}
            ${rounded}
            transition-opacity duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
    </div>
  )
}
