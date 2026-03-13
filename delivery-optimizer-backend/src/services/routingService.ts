import { pool } from '../database/connection';

interface Point {
  lat: number;
  lng: number;
}

// Velocidades médias em km/h para cada perfil
const speedProfiles = {
  car: 50,
  bike: 15,
  foot: 5
};

// Tipos de highway permitidos para cada perfil
const allowedHighways = {
  car: [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'service',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link'
  ],
  bike: [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'service',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
    'cycleway', 'path', 'track'
  ],
  foot: [
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'unclassified', 'residential', 'service',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
    'cycleway', 'path', 'track', 'footway', 'steps', 'pedestrian'
  ]
};

export async function calculateRoute(waypoints: Point[], profile: 'car' | 'bike' | 'foot' = 'car') {
  console.log('=== calculateRoute iniciado ===');
  console.log('Waypoints recebidos:', waypoints);
  console.log('Perfil:', profile);

  if (waypoints.length < 2) {
    console.log('Menos de 2 waypoints, abortando.');
    return null;
  }

  // 1. Encontrar vértices mais próximos
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

  // 2. Criar string com tipos separados por vírgula (ex: 'motorway,trunk,...')
  const allowedString = allowedHighways[profile].join(',');
  console.log('Allowed highways string:', allowedString);

  const avgSpeedKmh = speedProfiles[profile];

  // 3. Consulta da rota usando string_to_array para converter a string em array
  const routeQuery = `
SELECT seq, node, edge, cost, ST_AsGeoJSON(ST_Transform(ways.geom, 4326))::json AS geom
FROM pgr_dijkstra(
  'SELECT id, source, target,
          ST_Length(ST_Transform(geom,4326)::geography) / (${avgSpeedKmh} * 1000.0 / 3600.0) AS cost
   FROM ways
   WHERE source IS NOT NULL AND target IS NOT NULL
     AND highway = ANY(string_to_array(''${allowedString}'', '',''))',
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
    throw new Error('Nenhuma rota encontrada entre os vértices selecionados para o perfil escolhido.');
  }

  let allCoordinates: number[][] = [];
  for (const row of result.rows) {
    if (row.geom?.type === 'LineString') {
      allCoordinates.push(...row.geom.coordinates);
    }
  }

  // Custo total em segundos (soma dos costs)
  const totalTimeSeconds = result.rows.reduce((acc, row) => acc + row.cost, 0);
  // Distância aproximada (custo * velocidade convertida)
  const totalDistanceMeters = result.rows.reduce((acc, row) => acc + (row.cost * (avgSpeedKmh * 1000 / 3600)), 0);
  const totalDistanceKm = totalDistanceMeters / 1000;
  const durationMinutes = totalTimeSeconds / 60;

  console.log(`Distância total: ${totalDistanceKm.toFixed(2)} km`);
  console.log(`Tempo total: ${durationMinutes.toFixed(0)} min`);
  console.log('=== calculateRoute finalizado ===');

  return {
    geometry: {
      type: 'LineString',
      coordinates: allCoordinates,
    },
    distanceKm: totalDistanceKm,
    durationMin: durationMinutes,
    profile: profile
  };
}