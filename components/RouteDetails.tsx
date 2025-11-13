import React from 'react';
import { Route, RouteWaypoint } from '../types';
import { mockWaypoints } from '../data/mockRoutesData';
import { ClockIcon, MapPinIcon, RoadIcon, WarningIcon } from './icons/Icons';

interface RouteDetailsProps {
  route: Route;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
    <div className="p-2 bg-orange-100 text-orange-600 rounded-full mr-4">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const RouteMapPlaceholder: React.FC<{route: Route}> = ({route}) => {
    // A simple SVG placeholder to represent a map
    return (
        <div className="bg-gray-200 rounded-lg h-64 w-full flex items-center justify-center p-4">
             <svg width="100%" height="100%" viewBox="0 0 200 100">
                <path d="M 20 80 Q 100 10, 180 80" stroke="#9ca3af" fill="none" strokeWidth="2" strokeDasharray="4 4"/>

                {/* Origin Pin */}
                <circle cx="20" cy="80" r="4" fill="#f97316" />
                <text x="22" y="75" fontSize="6" fill="currentColor">{route.origin_city}</text>

                {/* Destination Pin */}
                <circle cx="180" cy="80" r="4" fill="#16a34a" />
                <text x="150" y="75" fontSize="6" fill="currentColor">{route.destination_city}</text>
                
                <text x="50%" y="50%" textAnchor="middle" fontSize="8" fill="#6b7280" className="opacity-50">Map Visualization</text>
            </svg>
        </div>
    )
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route }) => {
  const waypoints = mockWaypoints.filter((wp) => wp.route_id === route.id);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-y-auto h-full">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-gray-900">{route.route_name}</h3>
        <p className="mt-1 text-md text-gray-500">{route.route_code}</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-5 h-5"/>} label="Distance" value={`${route.distance_km} km`} />
        <StatCard icon={<ClockIcon className="w-5 h-5"/>} label="Est. Duration" value={`${route.estimated_duration_hours} hours`} />
      </div>

      <RouteMapPlaceholder route={route} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><MapPinIcon className="w-5 h-5 mr-2"/>Waypoints</h4>
          <div className="space-y-3">
            {waypoints.length > 0 ? waypoints.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-semibold">{item.waypoint_order}. {item.location_name}</p>
                <p className="text-sm text-gray-500">Type: {item.location_type} {item.is_mandatory_stop && "(Mandatory)"}</p>
              </div>
            )) : <p className="text-sm text-gray-500">No waypoints for this route.</p>}
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center"><WarningIcon className="w-5 h-5 mr-2"/>Notes & Conditions</h4>
           <div className="p-3 bg-gray-50 rounded-lg space-y-2">
               <p><span className="font-semibold">Roads: </span>{route.road_conditions}</p>
               {route.notes && <p><span className="font-semibold">Notes: </span>{route.notes}</p>}
               {route.border_crossings.length > 0 && (
                   <div>
                       <p className="font-semibold">Border Crossings:</p>
                       <ul className="list-disc list-inside text-sm pl-2">
                           {route.border_crossings.map(bc => <li key={bc.name}>{bc.name} (~{bc.avg_wait_hours}hr wait)</li>)}
                       </ul>
                   </div>
               )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;