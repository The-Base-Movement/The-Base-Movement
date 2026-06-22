/**
 * @file use-toast.ts
 * @description Toast notification hook and state manager.
 * Implements a lightweight pub-sub storage pattern using useSyncExternalStore.
 * Limits concurrent toast visibility and supports custom duration timers.
 */

import { useSyncExternalStore } from 'react'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

/**
 * Interface representing active Toast properties
 */
type ToasterToast = {
  /** Unique identifier for the toast */
  id: string
  /** Header or main title of the toast */
  title?: React.ReactNode
  /** Description or detail body text */
  description?: React.ReactNode
  /** Action node/button (e.g. undo) to render on the toast */
  action?: React.ReactNode
  /** Display variant style of the toast */
  variant?: 'default' | 'destructive'
  /** Open visibility state */
  open?: boolean
  /** Callback fired when toast visibility toggles */
  onOpenChange?: (open: boolean) => void
}

/** Action types supported by the toast reducer */
type ActionType = {
  ADD_TOAST: 'ADD_TOAST'
  UPDATE_TOAST: 'UPDATE_TOAST'
  DISMISS_TOAST: 'DISMISS_TOAST'
  REMOVE_TOAST: 'REMOVE_TOAST'
}

let count = 0

/**
 * Generates a unique safe integer id string
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | {
      type: ActionType['ADD_TOAST']
      toast: ToasterToast
    }
  | {
      type: ActionType['UPDATE_TOAST']
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType['DISMISS_TOAST']
      toastId?: ToasterToast['id']
    }
  | {
      type: ActionType['REMOVE_TOAST']
      toastId?: ToasterToast['id']
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Adds a toast id to the deferred removal timeout queue.
 *
 * @param toastId - Unique toast identifier
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer function to handle state updates for active toasts list.
 *
 * @param state - Current list of active toasts
 * @param action - Action to dispatch containing type and payload
 * @returns Updated state
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

let memoryState: State = { toasts: [] }
const listeners = new Set<(state: State) => void>()

/**
 * Subscribes a listener callback to toast store state changes.
 *
 * @param listener - Callback triggered when state updates
 * @returns Unsubscribe function
 */
function subscribe(listener: (state: State) => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Returns current snapshot of memory store state.
 */
function getSnapshot() {
  return memoryState
}

/**
 * Dispatches an action, updating state and notifying all subscribers.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

/**
 * Triggers a new toast notification.
 *
 * @param props - Toast properties without the unique id
 * @returns Toast control details (id, dismiss, update handlers)
 */
function toast({ ...props }: Omit<ToasterToast, 'id'>) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Custom React hook accessing global toast state.
 * Synchronizes across the external store.
 *
 * @returns Object including active toasts, trigger action, and dismiss method.
 */
function useToast() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }
