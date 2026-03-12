import { Router } from 'express';
import { calculateRoute } from '../services/routingService';

const router = Router();

router.post('/calculate', async (req, res) => {
  try {
    const { waypoints } = req.body; // array de {lat, lng}
    if (!waypoints || waypoints.length < 2) {
      return res.status(400).json({ error: 'Envie pelo menos 2 pontos' });
    }
    const route = await calculateRoute(waypoints);
    res.json(route);
  } catch (error) {
    console.error('Erro ao calcular rota:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;