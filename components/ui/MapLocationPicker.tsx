import { useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";

const MapLocationPicker = ({
  defaultLat = 13.1169,
  defaultLng = 80.0972,
  onLocationSelect,
  onError,
}: {
  defaultLat?: number;
  defaultLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const isInternalDragging = useRef(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      mapRef.current &&
      !mapInstance.current
    ) {
      const L = require("leaflet");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Define Avadi Bounding Box (~20km radius equivalent)
      const avadiBounds = L.latLngBounds(
        L.latLng(13.01, 79.99), // South-West Limit
        L.latLng(13.22, 80.2), // North-East Limit
      );

      const map = L.map(mapRef.current, {
        maxBounds: avadiBounds, // Restricts panning outside Avadi
        maxBoundsViscosity: 1.0,
        minZoom: 12,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
      }).addTo(map);

      // Validation Function
      const validateAndSetLocation = (latlng: any) => {
        isInternalDragging.current = true;
        if (avadiBounds.contains(latlng)) {
          marker.setLatLng(latlng);
          onLocationSelect(latlng.lat, latlng.lng);
          onError(null);
        } else {
          // Snap back to Avadi center if dragged outside limits
          marker.setLatLng([defaultLat, defaultLng]);
          map.setView([defaultLat, defaultLng], 14);
          onLocationSelect(defaultLat, defaultLng);
          onError("Location must be within Avadi Corporation limits.");
        }
      };

      marker.on("dragend", () => validateAndSetLocation(marker.getLatLng()));
      map.on("click", (e: any) => validateAndSetLocation(e.latlng));

      mapInstance.current = map;
      markerInstance.current = marker;
      onLocationSelect(defaultLat, defaultLng);

      // Ensure proper tile calculations after DOM layout settles
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, []);

  // Sync marker position and map center when coordinates change externally
  useEffect(() => {
    if (isInternalDragging.current) {
      isInternalDragging.current = false;
      return;
    }

    if (mapInstance.current && markerInstance.current) {
      const currentPos = markerInstance.current.getLatLng();
      if (
        Math.abs(currentPos.lat - defaultLat) > 0.0001 ||
        Math.abs(currentPos.lng - defaultLng) > 0.0001
      ) {
        markerInstance.current.setLatLng([defaultLat, defaultLng]);
        mapInstance.current.setView([defaultLat, defaultLng], 14);
        setTimeout(() => {
          mapInstance.current?.invalidateSize();
        }, 150);
      }
    }
  }, [defaultLat, defaultLng]);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-2xl z-0 relative border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
    />
  );
};

export default MapLocationPicker;
