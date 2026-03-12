import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routeRoutes from './routes/routeRoutes';
import geocodeRoutes from './routes/geocodeRoutes'; // <-- importe

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/routes', routeRoutes);
app.use('/api/geocode', geocodeRoutes); // <-- registre

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});