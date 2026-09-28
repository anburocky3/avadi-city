import { useRef, useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onError: (msg: string | null) => void;
  /** When set, map flyTo + marker auto-moves to these coords (autocomplete sync) */
  selectedCoords?: { lat: number; lng: number } | null;
  /**
   * Fired whenever the user taps the map or drags the marker to a valid position.
   * Parent uses this to reverse-geocode and auto-fill the address box.
   */
  onReverseGeocode?: (lat: number, lng: number) => void;
}

const MapLocationPicker = ({
  onLocationSelect,
  onError,
  selectedCoords,
  onReverseGeocode,
}: MapLocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  // Prevent reverse-geocode firing when autocomplete drives the map
  const isExternalUpdate = useRef(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // ── Initial map setup ───────────────────────────────────────────────────────
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

      const avadiBounds = L.latLngBounds(
        L.latLng(13.01, 79.99), // South-West
        L.latLng(13.22, 80.2),  // North-East
      );

      const map = L.map(mapRef.current, {
        maxBounds: avadiBounds,
        maxBoundsViscosity: 1.0,
        minZoom: 12,
        // Disable mousewheel zoom — avoids page-scroll conflict on desktop too
        scrollWheelZoom: false,
      }).setView([defaultLat, defaultLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
      }).addTo(map);

      // ── Location validation + reverse-geocode trigger ──────────────────────
      const validateAndSet = (latlng: any, fromUser: boolean) => {
        if (avadiBounds.contains(latlng)) {
          marker.setLatLng(latlng);
          onLocationSelect(latlng.lat, latlng.lng);
          onError(null);
          if (fromUser && onReverseGeocode) {
            onReverseGeocode(latlng.lat, latlng.lng);
          }
        } else {
          marker.setLatLng([defaultLat, defaultLng]);
          map.setView([defaultLat, defaultLng], 14);
          onLocationSelect(defaultLat, defaultLng);
          onError("Location must be within Avadi Corporation limits.");
        }
      };

      marker.on("dragend", () =>
        validateAndSet(marker.getLatLng(), !isExternalUpdate.current)
      );
      map.on("click", (e: any) => validateAndSet(e.latlng, true));

      mapInstance.current = map;
      markerInstance.current = marker;
      onLocationSelect(defaultLat, defaultLng);

      // ── Mobile scroll-trap fix ─────────────────────────────────────────────
      // On touch devices, map dragging is DISABLED by default so the user can
      // scroll the page freely. After holding the map for >160 ms the drag
      // re-enables, giving full control. On touchend it disables again.
      const isTouchDevice = "ontouchstart" in window;
      if (isTouchDevice) {
        map.dragging.disable();
        map.touchZoom.disable();

        let holdTimer: ReturnType<typeof setTimeout> | null = null;
        const el = mapRef.current;
        if (el) {
          el.addEventListener(
            "touchstart",
            () => {
              holdTimer = setTimeout(() => {
                map.dragging.enable();
                map.touchZoom.enable();
              }, 160);
            },
            { passive: true }
          );
          el.addEventListener(
            "touchend",
            () => {
              if (holdTimer) clearTimeout(holdTimer);
              // Small delay so the Leaflet click event fires before drag re-disables
              setTimeout(() => {
                map.dragging.disable();
                map.touchZoom.disable();
              }, 300);
            },
            { passive: true }
          );
          el.addEventListener(
            "touchcancel",
            () => {
              if (holdTimer) clearTimeout(holdTimer);
              map.dragging.disable();
              map.touchZoom.disable();
            },
            { passive: true }
          );
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fly-to sync when external coords arrive (autocomplete / form) ──────────
  useEffect(() => {
    if (selectedCoords && mapInstance.current && markerInstance.current) {
      isExternalUpdate.current = true;
      const { lat, lng } = selectedCoords;
      mapInstance.current.flyTo([lat, lng], 16, { animate: true, duration: 0.8 });
      markerInstance.current.setLatLng([lat, lng]);
      onLocationSelect(lat, lng);
      onError(null);
      setTimeout(() => { isExternalUpdate.current = false; }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCoords]);

  // ── GPS: Use My Current Location ──────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    // Avadi Corporation bounding box (matches MapLocationPicker map bounds)
    const AVADI_GPS_BOUNDS = {
      minLat: 13.01, maxLat: 13.22,
      minLng: 79.99, maxLng: 80.2,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // ── Boundary guard: reject if outside Avadi ──────────────────────
        const isInsideAvadi =
          lat >= AVADI_GPS_BOUNDS.minLat && lat <= AVADI_GPS_BOUNDS.maxLat &&
          lng >= AVADI_GPS_BOUNDS.minLng && lng <= AVADI_GPS_BOUNDS.maxLng;

        if (!isInsideAvadi) {
          setGpsError(
            "Your current GPS location is outside Avadi Corporation limits. Please choose a location within Avadi."
          );
          return;
        }

        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.flyTo([lat, lng], 16, { animate: true, duration: 0.9 });
          markerInstance.current.setLatLng([lat, lng]);
          onLocationSelect(lat, lng);
          onError(null);
          if (onReverseGeocode) onReverseGeocode(lat, lng);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED)
          setGpsError("Location access denied. Please allow GPS.");
        else
          setGpsError("Could not get your location. Try again.");
      },
      { timeout: 10000, maximumAge: 30000 }
    );
  };

  return (
    <div className="relative">
      {/* Map tile */}
      <div
        ref={mapRef}
        className="w-full h-64 rounded-2xl z-0 relative border border-slate-200 dark:border-slate-700 shadow-sm"
      />

      {/* 🎯 GPS floating button — top-right inside map */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        title="Use my current GPS location"
        className={`absolute top-2.5 right-2.5 z-[400] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition cursor-pointer select-none ${
          gpsLoading
            ? "bg-white/80 dark:bg-slate-900/80 text-slate-400"
            : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
        }`}
      >
        {gpsLoading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Locating…
          </>
        ) : (
          <>🎯 My Location</>
        )}
      </button>

      {/* GPS error */}
      {gpsError && (
        <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
          ⚠️ {gpsError}
        </p>
      )}

      {/* Mobile scroll hint */}
      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 text-center select-none">
        📱 Hold map to drag · Tap to pin · 🎯 for GPS
      </p>
    </div>
  );
};

export default MapLocationPicker;
