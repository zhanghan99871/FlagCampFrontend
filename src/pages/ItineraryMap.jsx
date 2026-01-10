import { Card } from "antd";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { Polyline } from "../util/Polyline";
import MapHandler from "../util/MapController";

const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const ItineraryMap = ({ activities, selectedDay }) => {
  return (
    <div style={{ flex: 1, padding: "20px", height: "90%", width: "80%" }}>
      <Card
        title="Trip Route & Destinations"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        styles={{ body: { flex: 1, padding: 0, position: "relative" } }}
      >
        <APIProvider apiKey={googleMapsApiKey}>
          <Map
            style={{ width: "100%", height: "100%" }}
            defaultCenter={{ lat: 40.7794, lng: -73.9632 }}
            defaultZoom={13}
            mapId="MAP_ID"
          >
            {/* Handles automatic day-switching pans */}
            <MapHandler activities={activities} selectedDay={selectedDay} />

            {/* The Connection Line */}
            {activities.length > 1 && (
              <Polyline
                path={activities.map((loc) => ({
                  lat: Number(loc.lat),
                  lng: Number(loc.lng),
                }))}
                options={{
                  strokeColor: "#1890ff",
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            )}

            {/* Markers */}
            {activities.map((loc, index) => (
              <AdvancedMarker
                key={`${loc.poiId}-${index}`}
                position={{ lat: loc.lat, lng: loc.lng }}
              >
                <Pin
                  background={"#1890ff"}
                  glyphColor={"#fff"}
                  glyph={(index + 1).toString()}
                  borderColor={"#ffffff"}
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </Card>
    </div>
  );
};

export default ItineraryMap;
