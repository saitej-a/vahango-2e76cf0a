import { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

interface MapProps {
  center: { lat: number; lng: number };
  markers?: Array<{
    position: { lat: number; lng: number };
    label?: string;
    icon?: string;
  }>;
  showDirections?: boolean;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

const Map = ({
  center,
  markers = [],
  showDirections = false,
  origin,
  destination,
  zoom = 14,
  height = "100%",
}: MapProps) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (showDirections && origin && destination && window.google) {
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          }
        }
      );
    }
  }, [showDirections, origin, destination]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div 
        className="bg-muted flex items-center justify-center text-center p-6"
        style={{ height }}
      >
        <div>
          <p className="text-muted-foreground mb-2">
            Google Maps API key not configured
          </p>
          <p className="text-xs text-muted-foreground">
            Add VITE_GOOGLE_MAPS_API_KEY to your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={center}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Render markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            label={marker.label}
            icon={marker.icon}
          />
        ))}

        {/* Render directions */}
        {showDirections && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: "#2563EB",
                strokeWeight: 5,
              },
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
