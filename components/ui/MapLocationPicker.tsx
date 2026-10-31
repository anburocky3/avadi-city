import React, { useRef, useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { Crosshair, Loader2, MapPin } from "lucide-react";

const MapLocationPicker = ({
  defaultLat = 13.1169,
  defaultLng = 80.0972,
  zoom = 14,
  onLocationSelect,
  onError,
  onReverseGeocode,
}: {
  defaultLat?: number;
  defaultLng?: number;
  zoom?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
  onReverseGeocode?: (lat: number, lng: number) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const isInternalDragging = useRef(false);
  const avadiBoundsRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Expose a method to programmatically fly the map to a given location
  const flyToLocation = useCallback(
    (lat: number, lng: number, targetZoom?: number) => {
      if (!mapInstance.current || !markerInstance.current) return;
      isInternalDragging.current = true;
      markerInstance.current.setLatLng([lat, lng]);
      const z = targetZoom || 16;
      if (typeof mapInstance.current.flyTo === "function") {
        mapInstance.current.flyTo([lat, lng], z, { duration: 0.8 });
      } else {
        mapInstance.current.setView([lat, lng], z);
      }
      setTimeout(() => {
        mapInstance.current?.invalidateSize();
      }, 150);
    },
    [],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError(
        "Location access is not supported by your browser. Please select your location manually on the map.",
      );
      return;
    }

    setIsLocating(true);
    onError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Validate coordinates are within Avadi bounds
        if (avadiBoundsRef.current) {
          const L = require("leaflet");
          const latlng = L.latLng(latitude, longitude);
          if (!avadiBoundsRef.current.contains(latlng)) {
            onError(
              "Your current location appears to be outside Avadi Corporation limits. Please select your location manually on the map.",
            );
            setIsLocating(false);
            return;
          }
        }

        flyToLocation(latitude, longitude, 17);
        onLocationSelect(latitude, longitude);
        onReverseGeocode?.(latitude, longitude);
        onError(null);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            onError(
              "Location access is denied. Please enable location permissions in your browser settings or select your location manually.",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            onError(
              "Unable to detect your location. Please select it manually on the map.",
            );
            break;
          case error.TIMEOUT:
            onError(
              "Location detection timed out. Please try again or select your location manually on the map.",
            );
            break;
          default:
            onError(
              "Unable to detect your location. Please select it manually on the map.",
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }, [flyToLocation, onLocationSelect, onError, onReverseGeocode]);

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
      avadiBoundsRef.current = avadiBounds;

      const initialZoom = zoom || 14;
      const map = L.map(mapRef.current, {
        maxBounds: avadiBounds, // Restricts panning outside Avadi
        maxBoundsViscosity: 1.0,
        minZoom: 11,
        maxZoom: 18,
      }).setView([defaultLat, defaultLng], initialZoom);

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
          onReverseGeocode?.(latlng.lat, latlng.lng);
        } else {
          // Snap back to Avadi center if dragged outside limits
          marker.setLatLng([defaultLat, defaultLng]);
          map.setView([defaultLat, defaultLng], initialZoom);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position and map center when coordinates change externally
  useEffect(() => {
    if (isInternalDragging.current) {
      isInternalDragging.current = false;
      return;
    }

    if (mapInstance.current && markerInstance.current) {
      const currentPos = markerInstance.current.getLatLng();
      const currentZoom = mapInstance.current.getZoom();
      const targetZoom = zoom || 15;
      const hasMoved =
        Math.abs(currentPos.lat - defaultLat) > 0.00005 ||
        Math.abs(currentPos.lng - defaultLng) > 0.00005;
      const zoomChanged = zoom !== undefined && currentZoom !== zoom;

      if (hasMoved || zoomChanged) {
        markerInstance.current.setLatLng([defaultLat, defaultLng]);
        if (typeof mapInstance.current.flyTo === "function") {
          mapInstance.current.flyTo([defaultLat, defaultLng], targetZoom, {
            duration: 0.8,
          });
        } else {
          mapInstance.current.setView([defaultLat, defaultLng], targetZoom);
        }
        setTimeout(() => {
          mapInstance.current?.invalidateSize();
        }, 150);
      }
    }
  }, [defaultLat, defaultLng, zoom]);

  return (
    <div className="space-y-2">
      {/* Use My Current Location Button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
      >
        {isLocating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Detecting your location...</span>
          </>
        ) : (
          <>
            <Crosshair size={16} />
            <span>Use My Current Location</span>
          </>
        )}
      </button>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-2xl z-0 relative border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
      />

      {/* Map Instructions */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
        <MapPin size={11} />
        Click on the map or drag the marker to pinpoint the exact location
      </p>
    </div>
  );
};

export default MapLocationPicker;
