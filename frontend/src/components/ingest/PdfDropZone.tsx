import { useCallback, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'

interface Props {
  onFileSelect: (file: File) => void
  file: File | null
  onClear: () => void
  error: string | null
}

export function PdfDropZone({ onFileSelect, file, onClear, error }: Props) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped?.type === 'application/pdf') {
        onFileSelect(dropped)
      }
    },
    [onFileSelect]
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
        dragOver ? 'border-cyan bg-cyan/5' : 'border-border'
      } ${error ? 'border-srs-critico' : ''}`}
    >
      {file ? (
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-streak" />
          <span className="font-medium">{file.name}</span>
          <span className="text-sm text-muted">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
          <button onClick={onClear} className="text-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <Upload size={40} className="text-muted" />
          <p className="mt-3 text-muted">Arrastra un PDF aquí o</p>
          <label className="mt-2 cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground">
            Seleccionar archivo
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]) }}
              className="hidden"
            />
          </label>
        </>
      )}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-srs-critico">
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  )
}
