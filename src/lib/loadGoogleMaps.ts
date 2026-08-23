let loadPromise: Promise<typeof google> | null = null;

/**
 * Loads the Google Maps JS API (Places library) exactly once and returns
 * a promise that resolves with the global `google` namespace.
 */
export function loadGoogleMaps(): Promise<typeof google> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Maps can only be loaded in the browser"));
      return;
    }

    if (window.google?.maps?.places) {
      resolve(window.google);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"));
      return;
    }

    const callbackName = "__londileGoogleMapsCallback";
    (window as any)[callbackName] = () => {
      resolve(window.google);
      delete (window as any)[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
