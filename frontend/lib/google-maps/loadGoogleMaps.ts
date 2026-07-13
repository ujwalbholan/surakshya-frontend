/** Libraries requested when injecting the Maps JS script. */
export const GOOGLE_MAPS_LIBRARIES = 'places'

const SCRIPT_CALLBACK_NAME = '__googleMapsCallback'
const SCRIPT_ID = 'google-maps-js-places'

declare global {
  interface Window {
    google?: typeof google
    [SCRIPT_CALLBACK_NAME]?: () => void
  }
}

let loadPromise: Promise<typeof google> | null = null

/**
 * Lazily injects the Google Maps JS API (Places library) once.
 * Safe to call from multiple components — caches the in-flight promise.
 */
export function loadGoogleMapsScript(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Google Maps can only be loaded in the browser.'),
    )
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (loadPromise) {
    return loadPromise
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(
      new Error(
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing. Add it to your environment to enable Places autocomplete.',
      ),
    )
  }

  loadPromise = new Promise<typeof google>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      // Script tag present but google not ready yet — wait on callback.
      const previous = window[SCRIPT_CALLBACK_NAME]
      window[SCRIPT_CALLBACK_NAME] = () => {
        previous?.()
        if (window.google?.maps) {
          resolve(window.google)
        } else {
          loadPromise = null
          reject(new Error('Google Maps loaded but google.maps is unavailable.'))
        }
      }
      return
    }

    window[SCRIPT_CALLBACK_NAME] = () => {
      delete window[SCRIPT_CALLBACK_NAME]
      if (window.google?.maps) {
        resolve(window.google)
      } else {
        loadPromise = null
        reject(new Error('Google Maps loaded but google.maps is unavailable.'))
      }
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${encodeURIComponent(apiKey)}` +
      `&libraries=${GOOGLE_MAPS_LIBRARIES}` +
      `&loading=async` +
      `&callback=${SCRIPT_CALLBACK_NAME}`

    script.onerror = () => {
      loadPromise = null
      delete window[SCRIPT_CALLBACK_NAME]
      script.remove()
      reject(new Error('Failed to load the Google Maps JavaScript API.'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}
