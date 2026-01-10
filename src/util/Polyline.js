import { useEffect, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

export const Polyline = ({ path, strokeColor = "#1890ff" }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const [polyline, setPolyline] = useState(null);

  useEffect(() => {
    // Wait for the library and map instance to be ready
    if (!map || !mapsLib) return;

    const line = new mapsLib.Polyline({
      strokeColor,
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map: map,
    });

    setPolyline(line);

    return () => line.setMap(null);
  }, [map, mapsLib]);

  useEffect(() => {
    if (polyline && path && path.length > 0) {
      polyline.setPath(path);

      // Access LatLngBounds specifically from the mapsLib object
      const bounds = new window.google.maps.LatLngBounds();

      path.forEach((point) => {
        if (point.lat && point.lng) {
          bounds.extend(point);
        }
      });

      if (path.length > 1) {
        map.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 400,
        });
      }
    }
  }, [polyline, path, map]);

  return null;
};
