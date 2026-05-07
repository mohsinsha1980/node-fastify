import mongoose from "mongoose";
import { FastifyInstance } from "fastify";
import { env } from "../config.js";

export default async function dbConnector(fastify: FastifyInstance) {
  try {
    await mongoose.connect(env.MONGO_URI);
    fastify.log.info("MongoDB connected");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
