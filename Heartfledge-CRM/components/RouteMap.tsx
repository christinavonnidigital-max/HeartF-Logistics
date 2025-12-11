import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { Route, RouteWaypoint } from '../types';

interface RouteMapProps {
  route: Route;
  waypoints: RouteWaypoint[];
}

const createMarkerIcon = (color: string) => {
  return L.divIcon({
    html: `<div class="p-1 rounded-full shadow-md" style="background-color: ${color}; border: 2px solid white;"><div class="w-2 h-2 rounded-full bg-white"></div></div>`,
    className: 'bg-transparent border-0',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const originIcon = createMarkerIcon('#f97316'); // orange-500
const destinationIcon = createMarkerIcon('#16a34a'); // green-600
const waypointIcon = createMarkerIcon('#6b7280'); // gray-500

const RouteMap: React.FC<RouteMapProps> = ({ route, waypoints }) => {
  if (!route.origin_latitude || !route.origin_longitude || !route.destination_latitude || !route.destination_longitude) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-500">
        Map data not available for this route.
      </div>
    );
  }

  const allPoints = useMemo(() => {
    const origin: L.LatLngTuple = [route.origin_latitude!, route.origin_longitude!];
    const destination: L.LatLngTuple = [route.destination_latitude!, route.destination_longitude!];
    
    const waypointPositions = waypoints
      .filter(wp => wp.latitude != null && wp.longitude != null) // Ensure waypoints have coordinates
      .sort((a, b) => a.waypoint_order - b.waypoint_order)
      .map(wp => [wp.latitude, wp.longitude] as L.LatLngTuple);

    return [origin, ...waypointPositions, destination];
  }, [route, waypoints]);
  
  const bounds = useMemo(() => L.latLngBounds(allPoints), [allPoints]);

  const FitBounds = () => {
    const map = useMap();
    useEffect(() => {
      if (bounds.isValid()) {
        // Check if the bounds represent a single point (south-west corner equals north-east corner).
        if (bounds.getSouthWest().equals(bounds.getNorthEast())) {
          map.setView(bounds.getCenter(), 13); // Set a sensible default zoom for a single location.
        } else {
          // Apply responsive padding for a better fit on different screen sizes.
          const isMobile = window.innerWidth < 768; // Tailwind's 'md' breakpoint
          const padding: L.PointTuple = isMobile ? [25, 25] : [50, 50];
          map.fitBounds(bounds, { padding });
        }
      }
    }, [map, bounds]); // Reruns only when map instance or bounds change
    return null;
  };

  const origin: L.LatLngTuple = allPoints[0];
  const destination: L.LatLngTuple = allPoints[allPoints.length - 1];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-inner">
      <MapContainer
        center={bounds.isValid() ? bounds.getCenter() : origin}
        scrollWheelZoom={true}
        className="h-64 w-full"
        zoom={6}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds.isValid() && <FitBounds />}

        <Marker position={origin} icon={originIcon}>
          <Popup>Origin: {route.origin_city}</Popup>
        </Marker>

        <Marker position={destination} icon={destinationIcon}>
          <Popup>Destination: {route.destination_city}</Popup>
        </Marker>
        
        {waypoints.map((wp) => (
          <Marker key={wp.id} position={[wp.latitude, wp.longitude]} icon={waypointIcon}>
            <Popup>
              <b>{wp.location_name}</b><br/>
              Type: {wp.location_type}
            </Popup>
          </Marker>
        ))}

        <Polyline
          positions={allPoints}
          color="#4f46e5"
          weight={3}
          dashArray="5, 10"
        />
      </MapContainer>
    </div>
  );
};

export default RouteMap;