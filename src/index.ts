import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoute } from "./routes/authRoute";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia();
app.use(cors({
    origin: ['http://localhost:3030'], // Your frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })) // Add CORS before other routes
  .use(
    swagger({
      path: 'swagger',

      documentation: {
        info: {
          title: 'AiiLabPortal API Demo',
          version: '1.0.0',
          description: 'REST API for AiiLabPortal system built with Elysia.js',
        },
        tags: [
          { name: 'auth', description: 'provide secure authentication and authorization mechanisms that allow users to register new accounts, log in, and access protected resources based on their roles and permissions \n\nNote: Always Use Profile Route After Login For Complete the token' },
        ],
      },
    })
  )
  .use(authRoute)
  .get("/healthz", () => ({ ok: true })
  .listen(3000);
  console.log(`🚀 API ready on http://localhost:${app.server?.port}`);
  console.log("Server is running on http://localhost:3000");
  console.log("Swagger documentation is available at http://localhost:3000/swagger");