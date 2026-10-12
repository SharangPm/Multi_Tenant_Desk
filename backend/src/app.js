import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errors, notFound } from './middleware/errors.js';
const app = express();
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup({
    openapi: '3.0.0',
    info: { title: 'ResolveDesk API', version: '1.0.0' },
    servers: [{ url: '/api' }],
    paths: {
      '/auth/login': {
        post: { summary: 'Authenticate and receive access and refresh JWTs' },
      },
      '/tickets': {
        get: { summary: 'List organization tickets; customers see their own' },
        post: { summary: 'Create a ticket' },
      },
      '/tickets/{id}': {
        get: { summary: 'Get ticket and conversation' },
        patch: { summary: 'Update ticket fields' },
      },
    },
  }),
);
app.use(notFound);
app.use(errors);
export default app;
