import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Successfully connected to the PostgreSQL database via Prisma.');
  } catch (error) {
    console.warn('Database connection warning (ensure PostgreSQL is running and migrations are applied):', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Brightloop Subscription Management Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
  });
};

startServer();
