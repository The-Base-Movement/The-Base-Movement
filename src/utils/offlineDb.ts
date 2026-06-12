import type { RegistrationFormData } from '@/types/registration'
import type { Area } from 'react-easy-crop'

export interface DraftRegistration {
  id: string
  platform: string
  formData: RegistrationFormData
  photoUrl?: string | null
  selfieUrl?: string | null
  croppedAreaPixels?: Area | null
  usedScan: boolean
  refParam: string | null
  createdAt: number
  status: 'pending' | 'syncing' | 'failed'
  errorMessage?: string
}

const DB_NAME = 'tbm_offline_db'
const STORE_NAME = 'draft_registrations'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveDraftRegistration(
  draft: Omit<DraftRegistration, 'id' | 'createdAt' | 'status'>
): Promise<DraftRegistration> {
  const db = await openDb()
  const fullDraft: DraftRegistration = {
    ...draft,
    id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    status: 'pending',
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(fullDraft)

    request.onsuccess = () => resolve(fullDraft)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllDraftRegistrations(): Promise<DraftRegistration[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function deleteDraftRegistration(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function updateDraftRegistrationStatus(
  id: string,
  status: DraftRegistration['status'],
  errorMessage?: string
): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const record = getRequest.result as DraftRegistration | undefined
      if (!record) {
        reject(new Error(`Draft with ID ${id} not found`))
        return
      }

      record.status = status
      if (errorMessage !== undefined) {
        record.errorMessage = errorMessage
      }

      const putRequest = store.put(record)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

export async function getDraftRegistrationCount(): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
