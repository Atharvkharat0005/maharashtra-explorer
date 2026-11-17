import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarker {
  id: string | number;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  kind?: 'attraction' | 'start' | 'hospital' | 'police' | 'pharmacy' | 'hotel' | 'restaurant' | 'district' | 'fuel';
  onClick?: () => void;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routePolyline?: Array<[number, number]>;
  heightClass?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

const KIND_COLORS: Record<string, { fill: string; stroke: string }> = {
  attraction: { fill: '#ea580c', stroke: '#ffffff' },
  start: { fill: '#0f172a', stroke: '#fbbf24' },
  hospital: { fill: '#dc2626', stroke: '#ffffff' },
  police: { fill: '#1d4ed8', stroke: '#ffffff' },
  pharmacy: { fill: '#059669', stroke: '#ffffff' },
  hotel: { fill: '#7c3aed', stroke: '#ffffff' },
  restaurant: { fill: '#d97706', stroke: '#ffffff' },
  district: { fill: '#0284c7', stroke: '#ffffff' },
  fuel: { fill: '#eab308', stroke: '#0f172a' }
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [19.4, 75.5] as [number, number],
  zoom = 7,
  markers = [],
  routePolyline = [],
  heightClass = 'h-96',
  onMapClick
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const boundsPoints: L.LatLngExpression[] = [];

    if (routePolyline && routePolyline.length >= 2) {
      const poly = L.polyline(routePolyline, {
        color: '#ea580c',
        weight: 4,
        opacity: 0.85
      }).addTo(group);
      poly.bindTooltip('OSRM Driving Route Estimate');
      routePolyline.forEach((pt) => boundsPoints.push(pt));
    }

    markers.forEach((m) => {
      if (Number.isNaN(m.lat) || Number.isNaN(m.lng)) return;
      const palette = KIND_COLORS[m.kind || 'attraction'] || KIND_COLORS.attraction;
      const marker = L.circleMarker([m.lat, m.lng], {
        radius: m.kind === 'start' ? 9 : 8,
        fillColor: palette.fill,
        color: palette.stroke,
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95
      }).addTo(group);

      const safeTitle = m.label.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeSub = (m.sublabel || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      marker.bindPopup(
        `<div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 150px;">
          <strong style="font-size: 13px; color: #1c1917;">${safeTitle}</strong>
          ${safeSub ? `<div style="font-size: 11px; color: #57534e; margin-top: 2px;">${safeSub}</div>` : ''}
          <div style="font-size: 10px; color: #78716c; margin-top: 4px;">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</div>
        </div>`
      );

      if (m.onClick) {
        marker.on('click', () => m.onClick?.());
      }

      boundsPoints.push([m.lat, m.lng]);
    });

    if (boundsPoints.length >= 2) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], Math.max(zoom, 11));
    } else {
      map.setView(center, zoom);
    }
  }, [markers, routePolyline, center[0], center[1], zoom]);

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative z-0`}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
