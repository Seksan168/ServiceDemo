// src/routes/authRoute.ts
import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import cookie from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { createUser, verifyUser, getUserById } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const isProd = process.env.NODE_ENV === "production";

// Reusable user response schema (ISO strings for dates)
const UserSchema = t.Object({
  id: t.String(),
  name: t.String(),
  email: t.String({ format: "email" }),
  role: t.String(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const authRoute = new Elysia({ prefix: "/auth" })
  // Swagger (can also be registered once globally, your choice)
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: { title: "Auth API", version: "1.0.0" },
        tags: [{ name: "auth", description: "Authentication endpoints" }],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "auth",
            },
          },
        },
      },
    })
  )
  // Cookies + JWT
  .use(cookie())
  .use(
    jwt({
      name: "jwt",
      secret: JWT_SECRET,
      exp: "7d",
    })
  )

  // POST /auth/register
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const user = await createUser(body.name, body.email, body.password);
        set.status = 201;
        return { message: "user created", user };
      } catch (err: any) {
        set.status = 400;
        return { message: err?.message ?? "failed to register" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["auth"],
        summary: "Register",
        description: "Create a new user account",
      },
      response: {
        201: t.Object({ message: t.String(), user: UserSchema }),
        400: t.Object({ message: t.String() }),
      },
    }
  )

  // POST /auth/login
  .post(
    "/login",
    async ({ body, set, jwt, cookie }) => {
      const user = await verifyUser(body.email, body.password);
      if (!user) {
        set.status = 401;
        return { message: "invalid email or password" };
      }

      const token = await jwt.sign({ sub: user.id, role: user.role });

      cookie.auth.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return { message: "login successful", user };
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
      }),
      detail: {
        tags: ["auth"],
        summary: "Login",
        description: "Authenticate user and set JWT cookie",
      },
      response: {
        200: t.Object({ message: t.String(), user: UserSchema }),
        401: t.Object({ message: t.String() }),
      },
    }
  )

  // POST /auth/logout
  .post(
    "/logout",
    async ({ cookie }) => {
      cookie.auth.remove();
      return { message: "logged out" };
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Logout",
        description: "Clears the auth cookie",
      },
      response: {
        200: t.Object({ message: t.String() }),
      },
    }
  )

  // GET /auth/profile
  .get(
    "/profile",
    async ({ jwt, cookie, set }) => {
      try {
        const token = cookie.auth?.value;
        if (!token) {
          set.status = 401;
          return { message: "unauthorized" };
        }

        const payload = await jwt.verify(token);
        if (!payload || typeof (payload as any).sub !== "string") {
          set.status = 401;
          return { message: "unauthorized" };
        }

        const user = await getUserById((payload as any).sub);
        if (!user) {
          set.status = 404;
          return { message: "user not found" };
        }

        return { message: "profile retrieved", user };
      } catch {
        set.status = 400;
        return { message: "invalid token" };
      }
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Profile",
        description: "Returns current user's profile using JWT cookie",
        security: [{ cookieAuth: [] }],
      },
      response: {
        200: t.Object({ message: t.String(), user: UserSchema }),
        401: t.Object({ message: t.String() }),
        404: t.Object({ message: t.String() }),
        400: t.Object({ message: t.String() }),
      },
    }
  );
