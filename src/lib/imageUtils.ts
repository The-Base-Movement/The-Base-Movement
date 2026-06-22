/**
 * @file imageUtils.ts
 * @description Provides helper utilities for canvas-based image cropping, format compression
 * using browser-image-compression, and conversion helpers between Blobs/Files and base64 DataURLs.
 */

import type { Area } from 'react-easy-crop'
import imageCompression from 'browser-image-compression'

/**
 * Utility wrapper returning a Promise that resolves to an HTMLImageElement from a URL string.
 *
 * @param url - Source image URL
 * @returns Promise resolving to HTMLImageElement
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

/**
 * Crops an image based on pixel bounding values and returns it as a WEBP Blob.
 *
 * @param imageSrc - URL or local storage representation of the image
 * @param pixelCrop - Coordinates and dimensions representing the cropped section
 * @returns Promise resolving to cropped image Blob, or null if context creation fails
 */
export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      'image/webp',
      0.85
    )
  })
}

/**
 * Compresses an input File or Blob using browser-image-compression.
 * Standardizes output formats to high-quality '.webp'.
 *
 * @param input - Original File or Blob image
 * @param name - Optional filename parameter
 * @returns Promise resolving to compressed WebP File object
 */
export async function compressForUpload(input: File | Blob, name?: string): Promise<File> {
  const fileName = name ?? (input instanceof File ? input.name : 'image')
  const file = input instanceof File ? input : new File([input], fileName, { type: input.type })
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.85,
    })
    const webpName = /\.[^.]+$/.test(fileName)
      ? fileName.replace(/\.[^.]+$/, '.webp')
      : fileName + '.webp'
    // Use original fileName for the rename — the library preserves the input name, renaming is our responsibility
    return new File([compressed], webpName, {
      type: 'image/webp',
    })
  } catch (err) {
    console.error('[imageUtils] Compression failed, uploading original:', err)
    return file
  }
}

/**
 * Converts a base64 DataURL representation back to an equivalent Blob.
 *
 * @param dataurl - Base64 data url string
 * @returns Blob containing the parsed byte data, or null if format is invalid
 */
export function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch) return null
  const mime = mimeMatch[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
