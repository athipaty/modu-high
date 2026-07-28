import ImageWithLoader from './ImageWithLoader'

interface FullImageModalProps {
  src: string
  onClose: () => void
}

export default function FullImageModal({ src, onClose }: FullImageModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center animate-fade-in cursor-pointer"
      onClick={onClose}
    >
      <div className="animate-scale-up">
        <ImageWithLoader
          src={src}
          alt="Full"
          wrapperClass="max-w-[95vw] max-h-[90vh]"
          imgClass="object-contain"
        />
      </div>
    </div>
  )
}
