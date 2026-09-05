import { useRef, useEffect } from "react";

const MapLocationPicker = ({
  onLocationSelect,
  onError,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

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

      const defaultLat = 13.1169;
      const defaultLng = 80.0972;

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
    }
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-2xl z-0 relative border border-slate-200 dark:border-slate-700 shadow-sm"
    />
  );
};

export default MapLocationPicker;
