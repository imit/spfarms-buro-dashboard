import { useEffect, useRef, useState, useCallback } from "react";

export interface PlaceResult {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  phone_number: string | null;
  website: string | null;
  place_id: string;
}

let googleMapsLoaded = false;
let googleMapsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (googleMapsLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    googleMapsLoading = true;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is not set");
      googleMapsLoading = false;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      googleMapsLoading = false;
      console.error("Failed to load Google Maps script");
      resolve();
    };
    document.head.appendChild(script);
  });
}

function extractAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string
): string {
  if (!components) return "";
  const component = components.find((c) => c.types.includes(type));
  return component?.long_name || "";
}

function extractShortAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string
): string {
  if (!components) return "";
  const component = components.find((c) => c.types.includes(type));
  return component?.short_name || "";
}

export function useGooglePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement | null>
) {
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    let mounted = true;

    loadGoogleMapsScript().then(() => {
      if (mounted) setIsLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    // Restrict to New York state
    const nyStateBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(40.4961, -79.7624), // SW corner of NY state
      new google.maps.LatLng(45.0153, -71.8562) // NE corner of NY state
    );

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment"],
      componentRestrictions: { country: "us" },
      bounds: nyStateBounds,
      strictBounds: true,
      fields: [
        "name",
        "formatted_address",
        "address_components",
        "geometry",
        "place_id",
        "formatted_phone_number",
        "website",
      ],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const components = place.address_components;
      const streetNumber = extractAddressComponent(components, "street_number");
      const route = extractAddressComponent(components, "route");
      const address = [streetNumber, route].filter(Boolean).join(" ");

      const result: PlaceResult = {
        name: place.name || "",
        address,
        city:
          extractAddressComponent(components, "locality") ||
          extractAddressComponent(components, "sublocality_level_1"),
        state: extractShortAddressComponent(
          components,
          "administrative_area_level_1"
        ),
        zip_code: extractAddressComponent(components, "postal_code"),
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        phone_number: place.formatted_phone_number || null,
        website: place.website || null,
        place_id: place.place_id || "",
      };

      setSelectedPlace(result);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, inputRef]);

  const clearPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  return { selectedPlace, clearPlace, isLoaded };
}
