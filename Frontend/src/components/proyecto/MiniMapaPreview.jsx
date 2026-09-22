import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const polygonALatLngs = (geojson) => {
  if (!geojson?.coordinates?.[0]) return [];
  return geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
};

const MiniMapaPreview = ({ zona, proyectoId }) => {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!zona || !contenedorRef.current) return;


    const zonaObjeto = typeof zona === "string" ? JSON.parse(zona) : zona;
    const latlngs = polygonALatLngs(zonaObjeto);
    if (!latlngs.length) return;

  
    const mapa = L.map(contenedorRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapa);

    const capaZona = L.polygon(latlngs, {
      color: "#2dd4bf",
      weight: 2,
      fillColor: "#2dd4bf",
      fillOpacity: 0.2,
    }).addTo(mapa);

    mapa.fitBounds(capaZona.getBounds(), { padding: [8, 8] });

    return () => {
      mapa.remove();
    };
  }, [zona]);

  if (!zona) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(45deg,#152023_0px,#152023_10px,#182a2d_10px,#182a2d_20px)]">
        <svg
          className="h-6 w-6 text-dash-text-soft/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-13l6 3m0 0l4.553-2.276A1 1 0 0121 5.618v10.764a1 1 0 01-.553.894L15 20m0-13v13"
          />
        </svg>
        <span className="text-xs text-dash-text-soft/70">Zona no delimitada</span>
      </div>
    );
  }

  return (
    <div
      id={`mini-mapa-${proyectoId}`}
      ref={contenedorRef}
      className="h-full w-full pointer-events-none"
    />
  );
};

export default MiniMapaPreview;