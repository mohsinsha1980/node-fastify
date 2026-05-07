// plugins/cookies.ts
import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";
import { env } from "../config.js";

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {
      sameSite: "lax",
    },
  });
});
