/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Render a reusable Mapbox location preview for report-detail
pages so teams can review exact or ZIP-derived placement without leaving the
current workflow.
*/

import { Link } from "react-router-dom";
import Map, {
  Marker,
  NavigationControl,
  ScaleControl,
} from "react-map-gl/mapbox";
import { ExternalLink, MapPin } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DetailLocationMap({ report }) {
  const latitude = Number(report.latitude);
  const longitude = Number(report.longitude);
  const zip = report.location?.zip || report.zip || "—";
  const coords = report.location?.coords || "—";
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const isExact = Boolean(report.location?.hasExactCoordinates);
  const viewState = {
    latitude: hasCoordinates ? latitude : 34.2,
    longitude: hasCoordinates ? longitude : -111.8,
    zoom: isExact ? 11.4 : 9.7,
  };
  const agencyMapHref = zip && zip !== "—"
    ? `/agency/map?zip=${encodeURIComponent(zip)}`
    : "/agency/map";
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : "https://www.google.com/maps";

  return (
    <div className="attach-tile attach-tile--location">
      <div className="detail-location-shell">
        {MAPBOX_TOKEN && hasCoordinates ? (
          <>
            <div className="detail-location-overlay detail-location-overlay--left">
              <span className="detail-location-chip">
                {isExact ? "Exact coordinates" : "ZIP centroid"}
              </span>
              <span className="detail-location-chip detail-location-chip--muted">
                ZIP {zip}
              </span>
            </div>
            <Link
              to={agencyMapHref}
              className="detail-location-overlay detail-location-overlay--action"
            >
              Agency map
            </Link>
            <Map
              initialViewState={viewState}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: "100%", height: "100%" }}
            >
              <NavigationControl position="bottom-right" showCompass={false} />
              <ScaleControl position="bottom-left" unit="imperial" />
              <Marker latitude={latitude} longitude={longitude} anchor="center">
                <span className="detail-location-pin" aria-hidden="true" />
              </Marker>
            </Map>
          </>
        ) : (
          <div className="map-placeholder detail-location-placeholder">
            <MapPin size={26} strokeWidth={1.8} />
            <div className="map-placeholder-title">Map preview unavailable</div>
            <div className="map-placeholder-copy">
              Add <code>VITE_MAPBOX_TOKEN</code> to show the live report location preview here.
            </div>
          </div>
        )}
      </div>

      <div className="attach-foot attach-foot--location">
        <span className="detail-location-meta">
          <MapPin size={12} />
          {coords} · ZIP {zip}
        </span>
        <span className="detail-location-links">
          <Link to={agencyMapHref}>Agency map</Link>
          <a href={googleMapsHref} target="_blank" rel="noreferrer">
            Open in Maps
            <ExternalLink size={12} strokeWidth={2} />
          </a>
        </span>
      </div>
    </div>
  );
}
