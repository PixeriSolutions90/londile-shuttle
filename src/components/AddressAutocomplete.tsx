'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/loadGoogleMaps';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { address: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  icon,
  className = '',
  wrapperClassName = 'flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let listener: google.maps.MapsEventListener | undefined;
    let cancelled = false;

    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !inputRef.current) return;

        autocompleteRef.current = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          componentRestrictions: { country: 'za' },
        });

        listener = autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (!place) return;
          const address = place.formatted_address || place.name || '';
          onChange(address);
          onPlaceSelect?.({
            address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          });
        });
      })
      .catch((err) => {
        console.error('Google Maps failed to load:', err);
        setUnavailable(true);
      });

    return () => {
      cancelled = true;
      listener?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapperClassName}>
      {icon}
      <input
        ref={inputRef}
        type="text"
        placeholder={unavailable ? `${placeholder} (search unavailable)` : placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent text-sm outline-none placeholder:text-gray-400 ${className}`}
        autoComplete="off"
      />
    </div>
  );
}
