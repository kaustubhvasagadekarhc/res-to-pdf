import { storage } from "../config/appwrite";
import { ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

type MulterFile = Express.Multer.File;

class FileUploadService {
  private readonly BUCKET_ID = process.env.APPWRITE_BUCKET_ID!;
  private readonly ENDPOINT = process.env.APPWRITE_ENDPOINT!;
  private readonly PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;

  /**
   * Upload file → Appwrite Storage
   * Generate public URL
   */
  async upload(file: MulterFile) {
    const fileId = ID.unique();
    const inputFile = InputFile.fromBuffer(file.buffer, file.originalname);

    let uploaded;

    try {
      uploaded = await storage.createFile({
        bucketId: this.BUCKET_ID,
        fileId,
        file: inputFile,
        permissions: [
          Permission.read(Role.any()),  // Public read
        ],
      });
    } catch (err) {
      console.error("Appwrite upload error:", err);
      throw new Error("Appwrite storage upload failed");
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
