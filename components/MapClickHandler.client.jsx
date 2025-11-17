// components/MapClickHandler.client.jsx
"use client";

import React from "react";
import { useMapEvents } from "react-leaflet";

/**
 * Props:
 *  - onPlaceSelected({ lat, lng, place })
 */
export default function MapClickHandler({ onPlaceSelected }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await res.json().catch(() => null);
        const addr = data?.address || {};
        const area = addr.neighbourhood || addr.suburb || addr.county || "";
        const city = addr.city || addr.town || addr.village || "";
        const pincode = addr.postcode || "";
        const parts = [area, city, pincode].filter(Boolean);
        const place =
          parts.length
            ? parts.join(", ")
            : data?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onPlaceSelected?.({ lat, lng, place });
      } catch (err) {
        onPlaceSelected?.({ lat, lng, place: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
      }
    },
  });

  return null;
}
