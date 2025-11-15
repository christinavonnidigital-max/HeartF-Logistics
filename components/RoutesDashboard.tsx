
import React, { useState, useMemo, useEffect } from 'react';
import { mockRoutes } from '../data/mockRoutesData';
import { Route, RouteType, RoadConditions } from '../types';
import RouteDetails from './RouteDetails';
import { PlusIcon, IllustrationMapIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import AddRouteModal from './AddRouteModal';

const RoutesDashboard: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(routes.length > 0 ? routes[0] : null);
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false);
  const [routeTypeFilter, setRouteTypeFilter] = useState<RouteType | 'all'>('all');
  const [roadConditionFilter, setRoadConditionFilter] = useState<RoadConditions | 'all'>('all');

  const filteredRoutes = useMemo(() => {
    return routes
      .filter(route => {
        if (routeTypeFilter === 'all') return true;
        return route.route_type === routeTypeFilter;
      })
      .filter(route => {
        if (roadConditionFilter === 'all') return true;
        return route.road_conditions === roadConditionFilter;
      });
  }, [routes, routeTypeFilter, roadConditionFilter]);

  useEffect(() => {
    // If there's no selected route, select the first one from the filtered list
    if (!selectedRoute && filteredRoutes.length > 0) {
        setSelectedRoute(filteredRoutes[0]);
    } 
    // If the currently selected route is no longer in the filtered list, update the selection
    else if (selectedRoute && !filteredRoutes.find(r => r.id === selectedRoute.id)) {
        setSelectedRoute(filteredRoutes.length > 0 ? filteredRoutes[0] : null);
    }
  }, [filteredRoutes, selectedRoute]);


  const handleAddRoute = (newRouteData: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'border_crossings' | 'toll_gates' | 'total_toll_cost' | 'is_active' | 'is_popular' | 'road_conditions'>) => {
    const newRoute: Route = {
        ...newRouteData,
        id: Date.now(),
        road_conditions: RoadConditions.GOOD, // Default value
        border_crossings: [],
        toll_gates: [],
        total_toll_cost: 0,
        is_active: true,
        is_popular: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    setRoutes(prev => [newRoute, ...prev]);
    setIsAddRouteModalOpen(false);
    setSelectedRoute(newRoute);
  };

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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Company Routes ({filteredRoutes.length})</h2>
                <button 
                className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                onClick={() => setIsAddRouteModalOpen(true)}
                >
                <PlusIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <select
                    value={routeTypeFilter}
                    onChange={(e) => setRouteTypeFilter(e.target.value as RouteType | 'all')}
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Types</option>
                    {Object.values(RouteType).map(type => (
                        <option key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <select
                    value={roadConditionFilter}
                    onChange={(e) => setRoadConditionFilter(e.target.value as RoadConditions | 'all')}
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Conditions</option>
                     {Object.values(RoadConditions).map(condition => (
                        <option key={condition} value={condition} className="capitalize">{condition}</option>
                    ))}
                </select>
            </div>
          </div>
          <div className="overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {filteredRoutes.map((route) => (
                <li
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                    selectedRoute?.id === route.id ? 'bg-orange-50 border-l-4 border-orange-500' : 'border-l-4 border-transparent'
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
              {filteredRoutes.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    <p>No routes match the selected filters.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedRoute ? (
            <RouteDetails route={selectedRoute} />
          ) : (
            <EmptyState
              icon={<IllustrationMapIcon />}
              title={routes.length > 0 ? "No Matching Routes" : "No Routes Defined"}
              message={routes.length > 0 ? "Adjust your filters or add a new route to get started." : "Create your first route to manage your logistics operations."}
            />
          )}
        </div>
      </div>
      {isAddRouteModalOpen && (
          <AddRouteModal 
            onClose={() => setIsAddRouteModalOpen(false)}
            onAddRoute={handleAddRoute}
          />
      )}
    </>
  );
};

export default RoutesDashboard;