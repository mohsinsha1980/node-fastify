import Fastify from "fastify";
import { env, isProduction } from "./config.js";

import db from "./plugins/db.js";
import jwt from "./plugins/jwt.js";
import cookies from "./plugins/cookies.js";
import authRoutes from "./modules/auth/auth.routes.js";
import "@fastify/jwt";

const app = Fastify({
  logger: isProduction
    ? {
        level: env.LOG_LEVEL,
        transport: {
          targets: [
            {
              target: "pino/file",
              options: {
                destination: `logs/app-${new Date().toISOString().split("T")[0]}.log`,
                mkdir: true,
              },
            },
          ],
        },
      }
    : {
        level: env.LOG_LEVEL,
        transport: {
          target: "pino-pretty",
        },
      },
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = (error as any).statusCode ?? 500;
  reply.status(statusCode).send({
    error: error instanceof Error ? error.message : "Internal Server Error",
  });
});

// Global hook (middleware)
app.addHook("onRequest", async (request, reply) => {
  request.log.info(
    { method: request.method, url: request.url },
    "Incoming request",
  );
});

app.addHook("onResponse", async (request, reply) => {
  request.log.info(
    { method: request.method, url: request.url },
    "Outgoing response",
  );
});

async function start() {
  await app.register(cookies);
  await app.register(jwt);
  await app.register(db);

  await app.register(authRoutes, { prefix: "/api/auth" });

  app.get(
    "/api",
    {
      preHandler: async (request, reply) => {
        request.log.info(
          { method: request.method, url: request.url },
          "Route-level middleware",
        );
      },
    },
    async () => ({ status: "OK" }),
  );

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start();
