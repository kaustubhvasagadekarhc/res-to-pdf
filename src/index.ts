import app from "./app";
import dotenv from "dotenv";
import http from 'http';
dotenv.config();

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
