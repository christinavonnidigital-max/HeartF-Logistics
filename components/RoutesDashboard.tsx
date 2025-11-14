
import React, { useState } from 'react';
import { mockRoutes } from '../data/mockRoutesData';
import { Route, RouteType } from '../types';
import RouteDetails from './RouteDetails';
import { PlusIcon, IllustrationMapIcon } from './icons/Icons';
import EmptyState from './EmptyState';

const RoutesDashboard: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(mockRoutes.length > 0 ? mockRoutes[0] : null);

  const getRouteTypeColor = (type: RouteType) => {
    switch (type) {
      case RouteType.CROSS_BORDER:
        return 'bg-yellow-100 text-yellow-800';
      case RouteType.DOMESTIC:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Company Routes ({mockRoutes.length})</h2>
          <button 
            className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
            onClick={() => alert('Add Route form would open here.')}
          >
            <PlusIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {mockRoutes.map((route) => (
              <li
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                  selectedRoute?.id === route.id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{route.route_name}</p>
                    <p className="text-sm text-gray-500">{route.distance_km} km</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRouteTypeColor(
                      route.route_type
                    )}`}
                  >
                    {route.route_type.replace('_', ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lg:col-span-2 flex flex-col gap-6">
        {selectedRoute ? (
          <RouteDetails route={selectedRoute} />
        ) : (
          <EmptyState
            icon={<IllustrationMapIcon />}
            title="Select a Route"
            message="Choose a route from the list to view its map, waypoints, and other details."
          />
        )}
      </div>
    </div>
  );
};

export default RoutesDashboard;
