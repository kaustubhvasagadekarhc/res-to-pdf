import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(), 
  limits: {
    fileSize: 20 * 1024 * 1024, 
  },
});

// Middleware wrapper for serverless functions
export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}