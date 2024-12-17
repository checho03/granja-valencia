// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Granja Valencia API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});