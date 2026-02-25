import app from "./app";
import dotenv from "dotenv";
import http from 'http';
import { checkDatabaseConnection } from "./config/database";
dotenv.config();

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Start server with database check
async function startServer() {
  try {
    await checkDatabaseConnection();
    server.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
}

startServer();
