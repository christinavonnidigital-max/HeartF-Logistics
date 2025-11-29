
import React, { useState, useMemo, useEffect } from 'react';
import { mockRoutes } from '../data/mockRoutesData';
import { Route, RouteType, RoadConditions } from '../types';
import RouteDetails from './RouteDetails';
import { PlusIcon, IllustrationMapIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import AddRouteModal from './AddRouteModal';
import { ShellCard, SectionHeader, StatusPill } from "./UiKit";

const RoutesDashboard: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(routes.length > 0 ? routes[0] : null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    if (!selectedRoute && filteredRoutes.length > 0) {
        setSelectedRoute(filteredRoutes[0]);
    } else if (selectedRoute && !filteredRoutes.find(r => r.id === selectedRoute.id)) {
        setSelectedRoute(filteredRoutes.length > 0 ? filteredRoutes[0] : null);
    }
  }, [filteredRoutes, selectedRoute]);


  const handleAddRoute = (newRouteData: Omit<Route, 'id' | 'created_at' | 'updated_at' | 'border_crossings' | 'toll_gates' | 'total_toll_cost' | 'is_active' | 'is_popular' | 'road_conditions'> & { road_conditions: RoadConditions } ) => {
    const newRoute: Route = {
        ...newRouteData,
        id: Date.now(),
        border_crossings: [],
        toll_gates: [],
        total_toll_cost: 0,
        is_active: true,
        is_popular: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    setRoutes(prev => [newRoute, ...prev]);
    setIsAddModalOpen(false);
    setSelectedRoute(newRoute);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* Left column - route list */}
        <ShellCard className="flex flex-col p-4">
          <SectionHeader
            title={`Company routes (${filteredRoutes.length})`}
            subtitle="Saved lanes and typical conditions"
            actions={
              <button
                className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition flex-shrink-0"
                onClick={() => setIsAddModalOpen(true)}
                aria-label="Add new route"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            }
          />

          <div className="mt-2 flex flex-col sm:flex-row gap-2">
                 <select
                    value={routeTypeFilter}
                    onChange={(e) => setRouteTypeFilter(e.target.value as RouteType | 'all')}
                    className="w-full rounded-xl border border-slate-200 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Types</option>
                    {Object.values(RouteType).map(type => (
                        <option key={type} value={type} className="capitalize">{type.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <select
                    value={roadConditionFilter}
                    onChange={(e) => setRoadConditionFilter(e.target.value as RoadConditions | 'all')}
                    className="w-full rounded-xl border border-slate-200 bg-white text-gray-900 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="all">All Conditions</option>
                     {Object.values(RoadConditions).map(condition => (
                        <option key={condition} value={condition} className="capitalize">{condition}</option>
                    ))}
                </select>
            </div>
          <div className="mt-3 -mx-2 px-2 flex-1 space-y-1 overflow-y-auto">
              {filteredRoutes.map((route) => {
                const isSelected = selectedRoute?.id === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(route)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 transition ${
                      isSelected ? "bg-orange-50 border border-orange-200" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {route.origin_city} - {route.destination_city}
                        </p>
                        <p className="text-xs text-slate-500">{route.distance_km} km</p>
                      </div>
                      <StatusPill
                        label={route.route_type === "cross_border" ? "Cross border" : "Domestic"}
                        tone={route.route_type === "cross_border" ? "info" : "success"}
                      />
                    </div>
                  </button>
                )
              })}
              {filteredRoutes.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    <p>No routes match the selected filters.</p>
                </div>
              )}
          </div>
        </ShellCard>

        {/* Right column - details */}
        <div className="flex flex-col">
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
      
      {isAddModalOpen && (
        <AddRouteModal
            onClose={() => setIsAddModalOpen(false)}
            onAddRoute={handleAddRoute}
        />
      )}
    </>
  );
};

export default RoutesDashboard;
