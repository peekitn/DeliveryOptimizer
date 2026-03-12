import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Point, LineString } from 'ol/geom';
import Feature from 'ol/Feature';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle, Stroke, Fill, Text } from 'ol/style';
import { defaults as defaultControls, Attribution } from 'ol/control';
import 'ol/ol.css';

interface Props {
  onAddPoint: (coord: [number, number]) => void;
  points: [number, number][];
  route?: any; // GeoJSON LineString (já a geometria)
}

const MapComponent: React.FC<Props> = ({ onAddPoint, points, route }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const pointLayerRef = useRef<VectorLayer<VectorSource>>();
  const routeLayerRef = useRef<VectorLayer<VectorSource>>();

  useEffect(() => {
    if (!mapRef.current) return;

    const initialMap = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: fromLonLat([-46.6333, -23.5505]), zoom: 12 }),
      controls: defaultControls({ attribution: false }).extend([
        new Attribution({ collapsible: false }),
      ]),
    });

    initialMap.on('click', (evt) => {
      const coord = toLonLat(evt.coordinate);
      onAddPoint([coord[0], coord[1]]);
    });

    setMap(initialMap);

    return () => {
      initialMap.setTarget(undefined);
    };
  }, []);

  // Resize observer
  useEffect(() => {
    if (!map) return;
    const resizeObserver = new ResizeObserver(() => map.updateSize());
    if (mapRef.current) resizeObserver.observe(mapRef.current);
    return () => resizeObserver.disconnect();
  }, [map]);

  // Atualiza pontos
  useEffect(() => {
    if (!map) return;
    if (pointLayerRef.current) map.removeLayer(pointLayerRef.current);

    const features = points.map((coord, index) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(coord)),
        label: `Ponto ${index + 1}`,
      });
      feature.setStyle(
        new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
          }),
          text: new Text({
            text: `${index + 1}`,
            fill: new Fill({ color: 'white' }),
            font: 'bold 12px sans-serif',
          }),
        })
      );
      return feature;
    });

    const vectorSource = new VectorSource({ features });
    const vectorLayer = new VectorLayer({ source: vectorSource });
    map.addLayer(vectorLayer);
    pointLayerRef.current = vectorLayer;
  }, [points, map]);

  // Atualiza rota
  useEffect(() => {
    if (!map) return;
    // Remove camada de rota anterior se existir
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = undefined;
    }

    // Se não há rota, não faz nada
    if (!route) return;

    // Verifica se a rota tem a estrutura esperada (GeoJSON LineString)
    // Agora route é a própria geometria, não o objeto com .geometry
    if (route.type !== 'LineString' || !route.coordinates) {
      console.error('Rota inválida (esperado LineString):', route);
      return;
    }

    try {
      const lineFeature = new Feature({
        geometry: new LineString(
          route.coordinates.map((c: [number, number]) => fromLonLat(c))
        ),
      });
      lineFeature.setStyle(
        new Style({ stroke: new Stroke({ color: 'blue', width: 4 }) })
      );

      const vectorSource = new VectorSource({ features: [lineFeature] });
      const vectorLayer = new VectorLayer({ source: vectorSource });
      map.addLayer(vectorLayer);
      routeLayerRef.current = vectorLayer;
    } catch (error) {
      console.error('Erro ao desenhar rota:', error);
    }
  }, [route, map]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapComponent;