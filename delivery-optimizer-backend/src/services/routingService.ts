import { pool } from '../database/connection';

interface Point {
  lat: number;
  lng: number;
}

export async function calculateRoute(waypoints: Point[]) {
  console.log('=== calculateRoute iniciado ===');
  console.log('Waypoints recebidos:', waypoints);

  if (waypoints.length < 2) {
    console.log('Menos de 2 waypoints, abortando.');
    return null;
  }

  const vertexIds: number[] = [];
  for (const wp of waypoints) {
    console.log(`Buscando vértice para ponto: (${wp.lat}, ${wp.lng})`);

    const query = `
      SELECT id FROM ways_vertices_pgr
      ORDER BY ST_Transform(geom, 4326) <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
      LIMIT 1
    `;
    const res = await pool.query(query, [wp.lng, wp.lat]);

    if (res.rows.length > 0) {
      console.log(`Vértice encontrado: id = ${res.rows[0].id}`);
      vertexIds.push(res.rows[0].id);
    } else {
      throw new Error(`Nenhum vértice encontrado para o ponto (${wp.lat}, ${wp.lng})`);
    }
  }

  console.log('Todos os vértices encontrados:', vertexIds);

  const source = vertexIds[0];
  const target = vertexIds[vertexIds.length - 1];
  console.log(`Origem (source): ${source}, Destino (target): ${target}`);

  // Agora usamos ST_Length(geom::geography) para obter distância em metros
  // A geometria está em 3857, então transformamos para 4326 e depois para geography
  const routeQuery = `
    SELECT seq, node, edge, cost, ST_AsGeoJSON(ST_Transform(ways.geom, 4326))::json AS geom
    FROM pgr_dijkstra(
      'SELECT id, source, target, ST_Length(ST_Transform(geom, 4326)::geography) AS cost FROM ways WHERE source IS NOT NULL AND target IS NOT NULL'::text,
      $1::integer,
      $2::integer,
      false
    ) AS route
    JOIN ways ON route.edge = ways.id
    ORDER BY seq;
  `;

  const result = await pool.query(routeQuery, [source, target]);
  console.log(`Número de arestas retornadas: ${result.rows.length}`);

  if (result.rows.length === 0) {
    throw new Error('Nenhuma rota encontrada entre os vértices selecionados.');
  }

  let allCoordinates: number[][] = [];
  for (const row of result.rows) {
    if (row.geom?.type === 'LineString') {
      allCoordinates.push(...row.geom.coordinates);
    }
  }

  // Soma dos custos (cada custo já está em metros)
  const totalDistanceMeters = result.rows.reduce((acc, row) => acc + row.cost, 0);
  const totalDistanceKm = totalDistanceMeters / 1000;

  // Velocidade média em km/h (ajuste conforme necessário)
  const avgSpeedKmh = 50;
  const durationHours = totalDistanceKm / avgSpeedKmh;
  const durationMinutes = durationHours * 60;

  console.log(`Distância total: ${totalDistanceKm.toFixed(2)} km`);
  console.log('=== calculateRoute finalizado ===');

  return {
    geometry: {
      type: 'LineString',
      coordinates: allCoordinates,
    },
    distanceKm: totalDistanceKm,
    durationMin: durationMinutes,
  };
}