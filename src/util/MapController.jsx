import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

const MapHandler = ({ activities }) => {
  const map = useMap();

  useEffect(() => {
    // 1. Safety check: Ensure map exists and activities are provided
    if (!map || !activities || activities.length === 0) return;

    // 2. Create the LatLngBounds instance
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    // 3. Loop through activities and extend bounds
    activities.forEach((poi) => {
      const lat = parseFloat(poi.lat);
      const lng = parseFloat(poi.lng);

      if (!isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng });
        hasValidPoints = true;
      }
    });

    // 4. Fit the map to the calculated bounds
    if (hasValidPoints) {
      // Use a small delay to ensure the map container has its dimensions
      const timeoutId = setTimeout(() => {
        map.fitBounds(bounds, {
          top: 80,
          right: 80,
          bottom: 80,
          left: 80,
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [map, activities]);

  return null;
};
export default MapHandler;
