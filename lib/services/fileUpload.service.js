import { storage } from '../config/appwrite.js';
import { ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

class FileUploadService {
  constructor() {
    this.BUCKET_ID = process.env.APPWRITE_BUCKET_ID;
    this.ENDPOINT = process.env.APPWRITE_ENDPOINT;
    this.PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
  }

  async upload(file) {
    const fileId = ID.unique();
    const inputFile = InputFile.fromBuffer(file.buffer, file.originalname);

    let uploaded;

    try {
      uploaded = await storage.createFile({
        bucketId: this.BUCKET_ID,
        fileId,
        file: inputFile,
        permissions: [
          Permission.read(Role.any()),
        ],
      });
    } catch (err) {
      console.error('Appwrite upload error:', err);
      throw new Error('Appwrite storage upload failed');
    }

    const fileUrl = `${this.ENDPOINT}/storage/buckets/${this.BUCKET_ID}/files/${uploaded.$id}/view?project=${this.PROJECT_ID}`;

    return {
      fileId: uploaded.$id,
      fileUrl,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}

export const fileUploadService = new FileUploadService();