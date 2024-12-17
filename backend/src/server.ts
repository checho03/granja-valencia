import express, { Application } from 'express';
import cors from 'cors';
import { sequelize, syncModels } from './models';
import loteRoutes from './routes/loteRoutes';
import corralRoutes from './routes/corralRoutes';
import cerdoRoutes from './routes/cerdoRoutes';

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/lotes', loteRoutes);
app.use('/api/corrales', corralRoutes);
app.use('/api/cerdos', cerdoRoutes);

// Iniciar servidor
const iniciarServidor = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a base de datos establecida');
    
    await syncModels();
    
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

iniciarServidor();

export { app };