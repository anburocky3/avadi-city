import React, { useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
  selectedLat?: number | null;
  selectedLng?: number | null;
  selectedAreaName?: string | null;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  onError,
  selectedLat,
  selectedLng,
  selectedAreaName,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    if (
      selectedCoords &&
      typeof selectedCoords.lat === "number" &&
      typeof selectedCoords.lng === "number" &&
      mapInstance.current &&
      markerInstance.current
    ) {
      markerInstance.current.setLatLng([
        selectedCoords.lat,
        selectedCoords.lng,
      ]);
      mapInstance.current.setView(
        [selectedCoords.lat, selectedCoords.lng],
        16,
        {
          animate: true,
        },
      );
    }
  }, [selectedCoords?.lat, selectedCoords?.lng]);

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

      const initialLat =
        typeof selectedLat === "number" && !isNaN(selectedLat)
          ? selectedLat
          : 13.1169;
      const initialLng =
        typeof selectedLng === "number" && !isNaN(selectedLng)
          ? selectedLng
          : 80.0972;

      // Define Avadi Bounding Box for marker validation (~25km radius encompassing all 48 Avadi wards)
      const avadiBounds = L.latLngBounds(
        L.latLng(12.98, 79.95), // South-West Limit
        L.latLng(13.25, 80.25), // North-East Limit
      );

      const map = L.map(mapRef.current, {
        zoomControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: false,
        minZoom: 10,
        maxZoom: 19,
      }).setView([initialLat, initialLng], 15);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], {
        draggable: true,
      }).addTo(map);

      if (selectedAreaName) {
        marker.bindPopup(selectedAreaName).openPopup();
      }

      // Validation Function
      const validateAndSetLocation = (latlng: any, isUserAction = false) => {
        if (avadiBounds.contains(latlng)) {
          marker.setLatLng(latlng);
          onLocationSelect(latlng.lat, latlng.lng, isUserAction);
          onError(null);
        } else {
          // Snap back to Avadi center if dragged outside limits
          marker.setLatLng([initialLat, initialLng]);
          map.setView([initialLat, initialLng], 15);
          onLocationSelect(initialLat, initialLng);
          onError("Location must be within Avadi Corporation limits.");
        }
      };

      marker.on("dragend", () =>
        validateAndSetLocation(marker.getLatLng(), true),
      );
      map.on("click", (e: any) => validateAndSetLocation(e.latlng, true));

      mapInstance.current = map;
      markerInstance.current = marker;
      onLocationSelect(initialLat, initialLng);

      // Force recalculation of map container dimensions once rendered
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically pan & move marker when selectedLat / selectedLng changes
  useEffect(() => {
    if (
      mapInstance.current &&
      markerInstance.current &&
      typeof selectedLat === "number" &&
      typeof selectedLng === "number" &&
      !isNaN(selectedLat) &&
      !isNaN(selectedLng)
    ) {
      markerInstance.current.setLatLng([selectedLat, selectedLng]);
      mapInstance.current.setView([selectedLat, selectedLng], 15, {
        animate: true,
      });

      if (selectedAreaName) {
        markerInstance.current.bindPopup(selectedAreaName).openPopup();
      }

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 150);
    }
  }, [selectedLat, selectedLng, selectedAreaName]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {selectedAreaName && (
        <div className="absolute top-2.5 left-2.5 z-[1000] bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md flex items-center gap-1.5 max-w-[85%] pointer-events-none">
          <MapPin size={13} className="text-amber-400 shrink-0" />
          <span className="truncate">{selectedAreaName}</span>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-56 sm:h-64 z-0 relative cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};

export default MapLocationPicker;
