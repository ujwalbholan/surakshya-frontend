/**
 * Minimal ambient types for Places API (New) used by the address autocomplete.
 * Avoids adding @types/google.maps to package.json.
 */

declare namespace google.maps {
  function importLibrary(name: 'places'): Promise<PlacesLibrary>

  interface PlacesLibrary {
    AutocompleteSessionToken: typeof places.AutocompleteSessionToken
    AutocompleteSuggestion: typeof places.AutocompleteSuggestion
  }

  interface LatLngLiteral {
    lat: number
    lng: number
  }

  interface CircleLiteral {
    center: LatLngLiteral
    radius: number
  }

  interface LatLng {
    lat(): number
    lng(): number
  }

  namespace places {
    class AutocompleteSessionToken {
      constructor()
    }

    interface AutocompleteRequest {
      input: string
      sessionToken?: AutocompleteSessionToken
      includedRegionCodes?: string[]
      locationBias?: LatLngLiteral | CircleLiteral
    }

    interface FormattableText {
      toString(): string
      text?: string
    }

    interface PlacePrediction {
      text: FormattableText
      placeId?: string
      toPlace(): Place
    }

    interface AutocompleteSuggestion {
      placePrediction: PlacePrediction | null
    }

    class AutocompleteSuggestion {
      static fetchAutocompleteSuggestions(
        request: AutocompleteRequest,
      ): Promise<{ suggestions: AutocompleteSuggestion[] }>
    }

    interface Place {
      id?: string | null
      formattedAddress?: string | null
      location?: LatLng | null
      fetchFields(options: {
        fields: Array<'formattedAddress' | 'location' | 'id'>
      }): Promise<{ place: Place }>
    }
  }
}

declare const google: {
  maps: typeof google.maps
}
