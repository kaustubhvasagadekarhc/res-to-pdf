import { config } from "dotenv";
import { Client, Storage } from "node-appwrite";

config(); // Load environment variables

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!); // server-side key

export const storage = new Storage(client);
