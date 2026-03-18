const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Barbearia',
      version: '1.0.0',
      description: 'Documentação da API para o Sistema de Agendamento de Barbearia',
    },
    servers: [
      {
        url: process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor da API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
