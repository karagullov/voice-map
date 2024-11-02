// Map.tsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map as MapboxMap } from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-sdk/services/directions';

mapboxgl.accessToken = 'pk.eyJ1Ijoia2FyYWd1bGxvdiIsImEiOiJjbTMwMG9zcm4wZXFhMnNyM3YxZ2Z4OGVqIn0.lsVyaFW5i3i56xjvWTTlyA';

const directionsClient = MapboxDirections({
  accessToken: mapboxgl.accessToken,
});

interface MapProps {
  userLocation: [number, number] | null;
  destination: [number, number] | null;
  onDirectionsAvailable: (directions: string[]) => void; // Callback for directions
}

const Map: React.FC<MapProps> = ({ userLocation, destination, onDirectionsAvailable }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapboxMap | null>(null);
  const [zoom] = useState(14);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: userLocation || [74.5952, 42.8776], // Default to Philharmonic if user location is not available
        zoom: zoom,
      });
    }
  }, [userLocation, zoom]);

  useEffect(() => {
    if (userLocation && destination && map.current) {
      directionsClient
        .getDirections({
          profile: 'walking',
          waypoints: [
            { coordinates: userLocation },
            { coordinates: destination },
          ],
          geometries: 'geojson', // Make sure we get a GeoJSON response
        })
        .send()
        .then((response) => {
          const route = response.body.routes[0].geometry.coordinates;
          const routeLine = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: route },
          };

          // Set data for the route
          if (map.current!.getSource('route')) {
            (map.current!.getSource('route') as mapboxgl.GeoJSONSource).setData(routeLine);
          } else {
            map.current!.addSource('route', { type: 'geojson', data: routeLine });
            map.current!.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 },
            });
          }

          // Extract and provide instructions
          const directions = response.body.routes[0].legs[0].steps.map(step => step.maneuver.instruction);
          onDirectionsAvailable(directions); // Pass instructions back to the App component
        })
        .catch(error => {
          console.error('Error fetching directions:', error);
        });
    }
  }, [userLocation, destination]);

  return <div ref={mapContainer} style={{ width: '100%', height: '500px' }} />;
};

export default Map;
