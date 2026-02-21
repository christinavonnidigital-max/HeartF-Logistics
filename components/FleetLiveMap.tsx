import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import * as L from "leaflet";
import { ShellCard, SectionHeader } from "./UiKit";
import type { Vehicle, GpsLocation } from "../types";

type FleetLiveMapProps = {
  vehicles: Vehicle[];
  gpsLocations: Record<number, GpsLocation>;
};

const MapBounds: React.FC<{ points: Array<[number, number]> }> = ({ points }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
};

const FleetLiveMap: React.FC<FleetLiveMapProps> = ({ vehicles, gpsLocations }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const simRef = useRef<number | null>(null);
  const simStateRef = useRef<Map<number, { lat: number; lng: number; speed: number; heading: number }>>(
    new Map()
  );

  const markers = useMemo(() => {
    return vehicles
      .map((v) => {
        const g = gpsLocations[v.id];
        if (!g) return null;
        return { vehicle: v, gps: g };
      })
      .filter(Boolean) as Array<{ vehicle: Vehicle; gps: GpsLocation }>;
  }, [vehicles, gpsLocations]);

  const points = markers.map((m) => [m.gps.latitude, m.gps.longitude] as [number, number]);

  const status = useMemo(() => {
    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;
    let online = 0;
    let offline = 0;
    let newest = 0;
    vehicles.forEach((v) => {
      const g = gpsLocations[v.id];
      if (!g) {
        offline += 1;
        return;
      }
      const t = new Date(g.timestamp).getTime();
      if (t > newest) newest = t;
      if (now - t <= ONLINE_THRESHOLD_MS) online += 1;
      else offline += 1;
    });
    return { online, offline, newest };
  }, [vehicles, gpsLocations]);

  const markerIcon = useMemo(() => {
    return L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full border-2 border-white shadow-md">
        <span style="font-size:10px;font-weight:700;">HF</span>
      </div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  useEffect(() => {
    if (!isSimulating) {
      if (simRef.current) window.clearInterval(simRef.current);
      simRef.current = null;
      return;
    }

    const token = (import.meta as any).env?.VITE_ADMIN_API_TOKEN || "";
    const seedDefaults = {
      1: { lat: -17.8252, lng: 31.0335 },
      2: { lat: -20.1581, lng: 28.5833 },
      3: { lat: -18.9707, lng: 32.671 },
      4: { lat: -26.2041, lng: 28.0473 },
      5: { lat: -17.8252, lng: 31.0335 },
    } as Record<number, { lat: number; lng: number }>;

    vehicles.forEach((v) => {
      if (simStateRef.current.has(v.id)) return;
      const g = gpsLocations[v.id];
      const base = g
        ? { lat: g.latitude, lng: g.longitude }
        : seedDefaults[v.id] || { lat: -17.8 + Math.random(), lng: 31 + Math.random() };
      simStateRef.current.set(v.id, {
        lat: base.lat,
        lng: base.lng,
        speed: 40 + Math.random() * 30,
        heading: Math.random() * 360,
      });
    });

    const tick = () => {
      simStateRef.current.forEach((state, id) => {
        const jitterLat = (Math.random() - 0.5) * 0.01;
        const jitterLng = (Math.random() - 0.5) * 0.01;
        state.lat += jitterLat;
        state.lng += jitterLng;
        state.heading = (state.heading + (Math.random() - 0.5) * 15 + 360) % 360;
        state.speed = Math.max(0, state.speed + (Math.random() - 0.4) * 5);
        fetch("/api/vehicle-locations/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-admin-token": token } : {}),
          },
          body: JSON.stringify({
            vehicleId: id,
            latitude: state.lat,
            longitude: state.lng,
            speed: Math.round(state.speed),
            heading: Math.round(state.heading),
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      });
    };

    tick();
    simRef.current = window.setInterval(tick, 5000);
    return () => {
      if (simRef.current) window.clearInterval(simRef.current);
      simRef.current = null;
    };
  }, [isSimulating, vehicles, gpsLocations]);

  return (
    <ShellCard className="overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="Fleet live map" subtitle="Latest GPS pings from active vehicles" />
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online {status.online}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Offline {status.offline}
            </span>
            <span className="hidden sm:inline text-slate-500">
              Last ping {status.newest ? new Date(status.newest).toLocaleTimeString() : "—"}
            </span>
            {(import.meta as any).env?.DEV ? (
              <button
                className="ml-2 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setIsSimulating((v) => !v)}
              >
                {isSimulating ? "Stop sim" : "Simulate GPS"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="h-72 w-full bg-slate-50">
        {markers.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            No live GPS data yet.
          </div>
        ) : (
          <MapContainer
            center={points[0]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            attributionControl={false}
          >
            <MapBounds points={points} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map(({ vehicle, gps }) => (
              <Marker key={vehicle.id} position={[gps.latitude, gps.longitude]} icon={markerIcon}>
                <Popup>
                  <div className="text-sm font-medium">
                    <div>{vehicle.registration_number}</div>
                    <div className="text-xs text-slate-600">Speed: {gps.speed ?? 0} km/h</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </ShellCard>
  );
};

export default FleetLiveMap;
