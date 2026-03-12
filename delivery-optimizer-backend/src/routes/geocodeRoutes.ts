import { Router } from 'express';
import { geocodeAddress } from '../services/geocoding';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }
    const result = await geocodeAddress(address);
    if (!result) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    res.json(result);
  } catch (error) {
    console.error('Erro na rota de geocoding:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;