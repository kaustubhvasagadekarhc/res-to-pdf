import { config } from 'dotenv';
import { Client, ID, Storage, Databases } from 'appwrite';

config(); 

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!) 
  .setProject(process.env.APPWRITE_PROJECT_ID!);

export const storage = new Storage(client);
export const databases = new Databases(client);

export const BUCKET_ID = process.env.APPWRITE_BUCKET_ID!;
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
export const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID!;
export const genId = () => ID.unique(); 
