import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type Post } from '../lib/api';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MALMO_CENTER: [number, number] = [13.0038, 55.6050];

interface Props {
  posts?: Post[];
  selectedPostId?: string;
  onPostClick?: (post: Post) => void;
  /** Pin-drop mode for CreatePostPage */
  pinDrop?: boolean;
  pinPosition?: { lat: number; lng: number } | null;
  onPinDrop?: (lat: number, lng: number) => void;
  className?: string;
}

export default function PostMap({
  posts = [], selectedPostId, onPostClick,
  pinDrop, pinPosition, onPinDrop, className,
}: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pinMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: MALMO_CENTER,
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.on('load', () => setReady(true));
    mapRef.current = map;

    return () => { map.remove(); };
  }, []);

  // Pin-drop click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pinDrop || !ready) return;

    function handleClick(e: mapboxgl.MapMouseEvent) {
      onPinDrop?.(e.lngLat.lat, e.lngLat.lng);
    }
    map.on('click', handleClick);
    map.getCanvas().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleClick);
      map.getCanvas().style.cursor = '';
    };
  }, [pinDrop, onPinDrop, ready]);

  // Pin-drop marker
  useEffect(() => {
    if (!mapRef.current || !ready) return;
    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }
    if (pinPosition) {
      pinMarkerRef.current = new mapboxgl.Marker({ color: '#e63946' })
        .setLngLat([pinPosition.lng, pinPosition.lat])
        .addTo(mapRef.current);
    }
  }, [pinPosition, ready]);

  // Post markers
  useEffect(() => {
    if (!mapRef.current || !ready) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    posts.forEach(post => {
      if (!post.meetingPoint) return;
      const isSelected = post._id === selectedPostId;
      const color = post.status === 'open' ? '#2d8a4e' : '#888';

      const marker = new mapboxgl.Marker({
        color: isSelected ? '#e63946' : color,
        scale: isSelected ? 1.2 : 0.9,
      })
        .setLngLat([post.meetingPoint.lng, post.meetingPoint.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setText(`${post.estimatedSEK} kr — ${post.donorAlias}`)
        )
        .addTo(mapRef.current!);

      marker.getElement().addEventListener('click', () => onPostClick?.(post));
      markersRef.current.push(marker);
    });
  }, [posts, selectedPostId, onPostClick, ready]);

  if (!MAPBOX_TOKEN) {
    return <div className={`post-map post-map--empty ${className ?? ''}`}>{t('map.tokenMissing')}</div>;
  }

  return (
    <div className={`post-map ${className ?? ''}`}>
      <div ref={containerRef} className="post-map__container" role="application" aria-label="Map" />
      {!ready && <div className="post-map__loading">{t('map.loading')}</div>}
    </div>
  );
}
