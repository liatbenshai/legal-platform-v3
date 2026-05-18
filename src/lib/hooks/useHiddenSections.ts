'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'legalPlatform.hiddenSystemSections'

function readFromStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : []
  } catch {
    return []
  }
}

function writeToStorage(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore quota errors
  }
}

export function useHiddenSections() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setHiddenIds(new Set(readFromStorage()))
  }, [])

  const hide = useCallback((sectionId: string) => {
    setHiddenIds((curr) => {
      const next = new Set(curr)
      next.add(sectionId)
      writeToStorage(Array.from(next))
      return next
    })
  }, [])

  const unhide = useCallback((sectionId: string) => {
    setHiddenIds((curr) => {
      const next = new Set(curr)
      next.delete(sectionId)
      writeToStorage(Array.from(next))
      return next
    })
  }, [])

  const isHidden = useCallback(
    (sectionId: string) => hiddenIds.has(sectionId),
    [hiddenIds]
  )

  return { hiddenIds, hide, unhide, isHidden }
}
