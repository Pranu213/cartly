import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initializeScheduledJobs } from './utils/scheduler.js';

// CARTLY-AGENT: Added scheduler initialization for ranking recalculation

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await connectDB();
    initializeScheduledJobs();

    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                  🚀 CARTLY BACKEND SERVER STARTED                  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

  Environment: ${NODE_ENV}
  Port: ${PORT}
  URL: http://localhost:${PORT}
  
  Health Check: http://localhost:${PORT}/api/health

  API Endpoints:
  - POST   /api/auth/register
  - POST   /api/auth/login
  - GET    /api/products
  - POST   /api/cart/add
  - POST   /api/orders
  - GET    /api/admin/dashboard

════════════════════════════════════════════════════════════════════
      `);
    });

    process.on('SIGTERM', () => {
      console.log('\n📌 SIGTERM received. Closing server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n📌 SIGINT received. Closing server gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
