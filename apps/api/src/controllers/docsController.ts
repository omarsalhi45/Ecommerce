import type { Request, Response } from 'express'

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'OSAI API',
    version: '0.9.0',
  },
  paths: {
    '/health': {
      get: {
        summary: 'API health check',
        responses: { '200': { description: 'API is healthy' } },
      },
    },
    '/products': {
      get: {
        summary: 'List storefront products',
        responses: { '200': { description: 'Product list' } },
      },
    },
    '/products/{id}': {
      get: {
        summary: 'Get one product',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Product detail' },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/products/{id}/reviews': {
      get: {
        summary: 'Get product reviews and rating summary',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Review list and summary' } },
      },
    },
    '/orders': {
      post: {
        summary: 'Create a checkout order',
        responses: {
          '201': { description: 'Order created' },
          '400': { description: 'Invalid checkout payload' },
        },
      },
    },
    '/orders/{id}/events': {
      get: {
        summary: 'Stream order status updates with Server-Sent Events',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'SSE stream opened' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a customer account',
        responses: { '201': { description: 'Registered user and JWT token' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate a user',
        responses: { '200': { description: 'Authenticated user and JWT token' } },
      },
    },
    '/admin/products': {
      post: {
        summary: 'Create an admin-managed product',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Product created' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
}

export const getOpenApiDocument = (_req: Request, res: Response) => {
  res.json(openApiDocument)
}
