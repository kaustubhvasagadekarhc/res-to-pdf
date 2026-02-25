import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Resume to PDF API',
      version: '1.0.0',
      description: 'API for resume processing and PDF generation',
    },
    servers: [
      {
        url: process.env.BACKEND_BASE_URL,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token',
        },
      },
    },
  },
  apis: [
    path.join(__dirname, '../routes/*.ts').replace(/\\/g, '/'),
    path.join(__dirname, '../controllers/*.ts').replace(/\\/g, '/')
  ],
};

export const specs = swaggerJsdoc(options);