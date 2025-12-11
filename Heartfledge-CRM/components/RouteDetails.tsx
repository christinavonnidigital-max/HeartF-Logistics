
import React from 'react';
import { Route } from '../types';
import { mockWaypoints } from '../data/mockRoutesData';
import { ClockIcon, MapPinIcon, RoadIcon, ExclamationTriangleIcon } from './icons/Icons';
import RouteMap from './RouteMap';
import { ShellCard, SubtleCard } from './UiKit';

interface RouteDetailsProps {
  route: Route;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <SubtleCard className="flex items-center gap-3 p-4">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        {icon}
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  </SubtleCard>
);


const RouteDetails: React.FC<RouteDetailsProps> = ({ route }) => {
  const waypoints = mockWaypoints.filter((wp) => wp.route_id === route.id);

  return (
    <ShellCard className="p-6 overflow-y-auto">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h3 className="text-2xl font-bold leading-6 text-slate-900">{route.route_name}</h3>
        <p className="mt-1 text-md text-slate-500">{route.route_code}</p>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard icon={<RoadIcon className="w-5 h-5"/>} label="Distance" value={`${route.distance_km} km`} />
        <StatCard icon={<ClockIcon className="w-5 h-5"/>} label="Est. Duration" value={`${route.estimated_duration_hours} hours`} />
      </div>

      <RouteMap route={route} waypoints={waypoints} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubtleCard className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center"><MapPinIcon className="w-5 h-5 mr-2 text-slate-500"/>Waypoints</h4>
          <div className="space-y-2">
            {waypoints.length > 0 ? waypoints.map((item) => (
              <div key={item.id} className="p-3 bg-white rounded-lg ring-1 ring-slate-100 text-sm">
                <p className="font-semibold text-slate-800">{item.waypoint_order}. {item.location_name}</p>
                <p className="text-xs text-slate-500">Type: {item.location_type} {item.is_mandatory_stop && "(Mandatory)"}</p>
              </div>
            )) : <p className="text-sm text-slate-500 p-3">No waypoints for this route.</p>}
          </div>
        </SubtleCard>
        <SubtleCard className="p-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center"><ExclamationTriangleIcon className="w-5 h-5 mr-2 text-slate-500"/>Notes & Conditions</h4>
           <div className="space-y-2 text-sm text-slate-700">
               <p><span className="font-semibold text-slate-800">Roads: </span><span className="capitalize">{route.road_conditions}</span></p>
               {route.notes && <p><span className="font-semibold text-slate-800">Notes: </span>{route.notes}</p>}
               {route.border_crossings.length > 0 && (
                   <div>
                       <p className="font-semibold mt-2 text-slate-800">Border Crossings:</p>
                       <ul className="list-disc list-inside space-y-1 text-slate-600">
                           {route.border_crossings.map(bc => <li key={bc.name}>{bc.name} (~{bc.avg_wait_hours}hr wait)</li>)}
                       </ul>
                   </div>
               )}
          </div>
        </SubtleCard>
      </div>
    </ShellCard>
  );
};

export default RouteDetails;
