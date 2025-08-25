import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoute } from "./routes/authRoute";

const PORT = Number(process.env.PORT ?? 3000);

export const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:3030"], // your Nuxt dev URL
      credentials: true,                 // needed for JWT cookie
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    swagger({
      path: "/swagger", // leading slash is safer
      documentation: {
        info: {
          title: "AiiLabPortal API Demo",
          version: "1.0.0",
          description: "REST API for AiiLabPortal system built with Elysia.js",
        },
        tags: [
          {
            name: "auth",
            description:
              "Provide secure authentication and authorization: register, login, and access protected resources by role.\n\nNote: After login, call /auth/profile to validate your token.",
          },
        ],
      },
    })
  )
  .use(authRoute)
  .get("/healthz", () => ({ ok: true })) // <-- missing ) fixed
  .listen(PORT);

console.log(`🚀 API ready on http://localhost:${app.server?.port}`);
console.log(`📚 Swagger: http://localhost:${app.server?.port}/swagger`);
