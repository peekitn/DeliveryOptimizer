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

  // 1. Para cada ponto, encontra o vértice mais próximo na rede viária
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
      console.error(`Nenhum vértice encontrado para o ponto (${wp.lat}, ${wp.lng})`);
      throw new Error(`Nenhum vértice encontrado para o ponto (${wp.lat}, ${wp.lng})`);
    }
  }

  console.log('Todos os vértices encontrados:', vertexIds);

  if (vertexIds.length < 2) {
    console.error('Menos de 2 vértices encontrados.');
    throw new Error('Não foi possível encontrar vértices próximos para os pontos fornecidos.');
  }

  // Usa o primeiro e o último vértice como origem e destino
  const source = vertexIds[0];
  const target = vertexIds[vertexIds.length - 1];
  console.log(`Origem (source): ${source}, Destino (target): ${target}`);

  // 2. Executa o algoritmo de Dijkstra para encontrar a rota
  console.log('Executando pgr_dijkstra...');
  const routeQuery = `
  SELECT seq, node, edge, cost, ST_AsGeoJSON(ST_Transform(ways.geom, 4326))::json AS geom
  FROM pgr_dijkstra(
    'SELECT id, source, target, ST_Length(ST_Transform(geom, 4326)) AS cost FROM ways WHERE source IS NOT NULL AND target IS NOT NULL'::text,
    $1::integer,
    $2::integer,
    false
  ) AS route
  JOIN ways ON route.edge = ways.id
  ORDER BY seq;
`;

  const result = await pool.query(routeQuery, [source, target]);
  console.log(`Número de arestas retornadas pelo pgr_dijkstra: ${result.rows.length}`);

  if (result.rows.length === 0) {
    console.error('Nenhuma rota encontrada entre os vértices selecionados.');
    throw new Error('Nenhuma rota encontrada entre os vértices selecionados.');
  }

  // 3. Monta a LineString concatenando as coordenadas de cada aresta
  let allCoordinates: number[][] = [];
  for (const row of result.rows) {
    if (row.geom && row.geom.type === 'LineString') {
      // row.geom.coordinates é um array de [lng, lat]
      allCoordinates.push(...row.geom.coordinates);
    } else {
      console.warn('Aresta sem geometria válida:', row);
    }
  }

  // 4. Calcula a distância total (soma dos custos)
  const totalCost = result.rows.reduce((acc, row) => acc + row.cost, 0);
  console.log(`Custo total da rota: ${totalCost}`);

  console.log('=== calculateRoute finalizado com sucesso ===');
  return {
    geometry: {
      type: 'LineString',
      coordinates: allCoordinates,
    },
    distance: totalCost,
  };
}