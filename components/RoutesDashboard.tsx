import React, { useState } from 'react';
import { mockRoutes } from '../data/mockRoutesData';
import { Route } from '../types';
import RouteDetails from './RouteDetails';
import { PlusIcon, RoadIcon } from './icons/Icons';

const RoutesDashboard: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(mockRoutes[0]);

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'cross_border':
        return 'bg-yellow-100 text-yellow-800';
      case 'domestic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col h-[calc(100vh-100px)]">
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
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRouteTypeColor(
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
      <div className="lg:col-span-2 flex flex-col gap-6 h-[calc(100vh-100px)]">
        {selectedRoute ? (
          <RouteDetails route={selectedRoute} />
        ) : (
          <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-md">
            <p className="text-gray-500">Select a route to see details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesDashboard;