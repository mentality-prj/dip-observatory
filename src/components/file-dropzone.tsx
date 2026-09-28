'use client'

import { useCallback, useRef, useState, type DragEvent, type ReactNode } from 'react'

export type FileDropzoneRenderState = {
  dragging: boolean
  openFilePicker: () => void
}

export type FileDropzoneProps = {
  accept: string
  children: (state: FileDropzoneRenderState) => ReactNode
  className?: string | ((dragging: boolean) => string)
  disabled?: boolean
  onFile: (file: File) => void | Promise<void>
  testId?: string
}

export function FileDropzone({
  accept,
  children,
  className,
  disabled = false,
  onFile,
  testId,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)

  const openFilePicker = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  function selectFile(file: File | undefined) {
    if (!file || disabled) return
    void onFile(file)
  }

  function dragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current += 1
    if (!disabled) setDragging(true)
  }

  function dragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  function dragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
  }

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    selectFile(event.dataTransfer.files?.[0])
  }

  return (
    <div
      data-testid={testId}
      data-dragging={dragging ? 'true' : 'false'}
      onDragEnter={dragEnter}
      onDragLeave={dragLeave}
      onDragOver={dragOver}
      onDrop={drop}
      className={typeof className === 'function' ? className(dragging) : className}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />
      {children({ dragging, openFilePicker })}
    </div>
  )
}
