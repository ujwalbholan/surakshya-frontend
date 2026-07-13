'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { loadGoogleMapsScript } from '@/lib/google-maps/loadGoogleMaps'
import { cn } from '@/lib/utils'

/** Debounce before firing Places autocomplete requests. */
export const AUTOCOMPLETE_DEBOUNCE_MS = 300
/** Minimum characters before querying Places. */
export const MIN_QUERY_LENGTH = 3
/** Cap suggestions shown in the dropdown. */
export const MAX_SUGGESTIONS = 6
/** Bias autocomplete toward Nepal (Kathmandu-ish center). */
export const NEPAL_BIAS_CENTER = { lat: 27.7172, lng: 85.324 } as const
/** Radius (meters) for locationBias — roughly covers Nepal. */
export const NEPAL_BIAS_RADIUS_METERS = 400_000
/** Restrict suggestions to Nepal. */
export const INCLUDED_REGION_CODES = ['np'] as const

export type PlaceSelectedPayload = {
  formattedAddress: string
  latitude: number
  longitude: number
  placeId: string
}

export type AddressAutocompleteInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  /** Called with place details on select; `null` when the user edits after a select (clears stale coords). */
  onPlaceSelected: (place: PlaceSelectedPayload | null) => void
  className?: string
  maxLength?: number
  placeholder?: string
  disabled?: boolean
}

type SuggestionItem = {
  key: string
  label: string
  prediction: google.maps.places.PlacePrediction
}

export function AddressAutocompleteInput({
  id,
  value,
  onChange,
  onPlaceSelected,
  className,
  maxLength,
  placeholder = 'Start typing an address…',
  disabled,
}: AddressAutocompleteInputProps) {
  const reactId = useId()
  const listboxId = `${reactId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  )
  const placesReadyRef = useRef(false)
  const hasSelectedPlaceRef = useRef(false)
  const requestIdRef = useRef(0)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [mapsError, setMapsError] = useState(false)

  const ensureSessionToken = useCallback(async () => {
    await loadGoogleMapsScript()
    const { AutocompleteSessionToken } =
      (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken()
    }
    placesReadyRef.current = true
    return {
      AutocompleteSessionToken,
      sessionToken: sessionTokenRef.current,
    }
  }, [])

  const mintNewSessionToken = useCallback(async () => {
    const { AutocompleteSessionToken } =
      (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
    sessionTokenRef.current = new AutocompleteSessionToken()
  }, [])

  useEffect(() => {
    let cancelled = false
    loadGoogleMapsScript()
      .then(() => google.maps.importLibrary('places'))
      .then(() => {
        if (!cancelled) {
          placesReadyRef.current = true
          setMapsError(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapsError(true)
          placesReadyRef.current = false
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (mapsError || disabled) return

    const query = value.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setLoading(false)
      setHighlightIndex(-1)
      return
    }

    const requestId = ++requestIdRef.current
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const { sessionToken } = await ensureSessionToken()
          const { AutocompleteSuggestion } =
            (await google.maps.importLibrary(
              'places',
            )) as google.maps.PlacesLibrary

          const { suggestions: raw } =
            await AutocompleteSuggestion.fetchAutocompleteSuggestions({
              input: query,
              sessionToken,
              includedRegionCodes: [...INCLUDED_REGION_CODES],
              locationBias: {
                center: { ...NEPAL_BIAS_CENTER },
                radius: NEPAL_BIAS_RADIUS_METERS,
              },
            })

          if (requestId !== requestIdRef.current) return

          const items: SuggestionItem[] = []
          for (const suggestion of raw) {
            const prediction = suggestion.placePrediction
            if (!prediction) continue
            const label = prediction.text.toString()
            items.push({
              key: prediction.placeId ?? `${label}-${items.length}`,
              label,
              prediction,
            })
            if (items.length >= MAX_SUGGESTIONS) break
          }

          setSuggestions(items)
          setOpen(true)
          setHighlightIndex(items.length > 0 ? 0 : -1)
        } catch {
          if (requestId !== requestIdRef.current) return
          setSuggestions([])
          setOpen(true)
          setHighlightIndex(-1)
        } finally {
          if (requestId === requestIdRef.current) {
            setLoading(false)
          }
        }
      })()
    }, AUTOCOMPLETE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, mapsError, disabled, ensureSessionToken])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setHighlightIndex(-1)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const selectSuggestion = useCallback(
    async (item: SuggestionItem) => {
      setOpen(false)
      setSuggestions([])
      setHighlightIndex(-1)
      setLoading(true)

      try {
        await ensureSessionToken()
        const place = item.prediction.toPlace()
        await place.fetchFields({
          fields: ['formattedAddress', 'location', 'id'],
        })

        const formattedAddress =
          place.formattedAddress?.trim() || item.label
        const lat = place.location?.lat()
        const lng = place.location?.lng()
        const placeId = place.id ?? item.prediction.placeId ?? ''

        if (
          typeof lat !== 'number' ||
          typeof lng !== 'number' ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng)
        ) {
          onChange(formattedAddress)
          hasSelectedPlaceRef.current = false
          onPlaceSelected(null)
          return
        }

        hasSelectedPlaceRef.current = true
        onChange(formattedAddress)
        onPlaceSelected({
          formattedAddress,
          latitude: lat,
          longitude: lng,
          placeId,
        })
        await mintNewSessionToken()
      } catch {
        // Manual entry remains available; selection simply failed.
        onChange(item.label)
        hasSelectedPlaceRef.current = false
        onPlaceSelected(null)
      } finally {
        setLoading(false)
      }
    },
    [ensureSessionToken, mintNewSessionToken, onChange, onPlaceSelected],
  )

  const handleInputChange = (next: string) => {
    onChange(next)
    if (hasSelectedPlaceRef.current) {
      hasSelectedPlaceRef.current = false
      onPlaceSelected(null)
      void mintNewSessionToken().catch(() => {
        sessionTokenRef.current = null
      })
    }
    if (next.trim().length >= MIN_QUERY_LENGTH) {
      setOpen(true)
    } else {
      setOpen(false)
      setSuggestions([])
    }
  }

  const showList =
    open &&
    !disabled &&
    !mapsError &&
    value.trim().length >= MIN_QUERY_LENGTH

  const activeOptionId =
    highlightIndex >= 0 && suggestions[highlightIndex]
      ? `${listboxId}-option-${highlightIndex}`
      : undefined

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        autoComplete="off"
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        placeholder={placeholder}
        className={cn(className)}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= MIN_QUERY_LENGTH && !mapsError) {
            setOpen(true)
          }
        }}
        onKeyDown={(e) => {
          if (!showList) return

          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (suggestions.length === 0) return
            setHighlightIndex((i) =>
              i < suggestions.length - 1 ? i + 1 : 0,
            )
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (suggestions.length === 0) return
            setHighlightIndex((i) =>
              i <= 0 ? suggestions.length - 1 : i - 1,
            )
          } else if (e.key === 'Enter') {
            if (highlightIndex >= 0 && suggestions[highlightIndex]) {
              e.preventDefault()
              void selectSuggestion(suggestions[highlightIndex])
            }
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
            setHighlightIndex(-1)
          }
        }}
      />

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-white/10 bg-[#111] py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-white/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </li>
          )}

          {!loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-white/50">
              No matches — you can still type a custom address
            </li>
          )}

          {suggestions.map((item, index) => {
            const selected = index === highlightIndex
            return (
              <li
                key={item.key}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm text-white/90',
                  selected ? 'bg-[#C0392B]/20 text-white' : 'hover:bg-white/5',
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  void selectSuggestion(item)
                }}
              >
                {item.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
