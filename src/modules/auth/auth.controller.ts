import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { User } from "../user/user.model.js";
import {
  createAuthSession,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
} from "./auth.service.js";
import { isProduction } from "../../config.js";

interface RefreshRequestGeneric extends RouteGenericInterface {
  Cookies: { refreshToken?: string };
}

export async function register(
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return reply.code(400).send({ message: "User already exists" });
  }

  await User.create({
    email,
    password: await hashPassword(password),
  });

  await createAuthSession(reply, email, isProduction);

  return reply.code(201).send({ message: "User registered successfully" });
}

export async function login(
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;

  const user = await User.findOne({ email });
  if (!user || !(await verifyPassword(password, user.password))) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  await createAuthSession(reply, email, isProduction);

  return reply.send({ message: "Logged in" });
}

export async function refresh(
  request: FastifyRequest<RefreshRequestGeneric>,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies?.refreshToken;
  if (!refreshToken) {
    return reply.code(401).clearCookie("accessToken", { path: "/" }).send({
      message: "Refresh token missing",
    });
  }

  let payload: { email: string; version: number };

  try {
    payload = request.server.jwt.verify<{ email: string; version: number }>(
      refreshToken,
    );
  } catch (error) {
    request.log.warn({ err: error }, "Invalid refresh token");
    return reply
      .code(401)
      .clearCookie("accessToken", { path: "/" })
      .clearCookie("refreshToken", { path: "/" })
      .send({ message: "Invalid refresh token" });
  }

  const user = await User.findOne({ email: payload.email });
  if (
    !user ||
    !user.refreshToken ||
    payload.version !== (user.refreshTokenVersion ?? 0)
  ) {
    return reply
      .code(401)
      .clearCookie("accessToken", { path: "/" })
      .clearCookie("refreshToken", { path: "/" })
      .send({ message: "Unauthorized" });
  }

  const validRefresh = await verifyRefreshToken(
    refreshToken,
    user.refreshToken,
  );
  if (!validRefresh) {
    return reply
      .code(401)
      .clearCookie("accessToken", { path: "/" })
      .clearCookie("refreshToken", { path: "/" })
      .send({ message: "Unauthorized" });
  }

  await createAuthSession(reply, user.email, isProduction);

  return reply.send({ message: "Token refreshed" });
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  try {
    console.log("request.cookies ", request.cookies);
    await request.jwtVerify();
    await User.updateOne(
      { email: request.user.email },
      {
        $unset: { refreshToken: "" },
        $inc: { refreshTokenVersion: 1 },
      },
    );
  } catch (error) {
    request.log.warn({ err: error }, "Logout called without valid JWT");
  }

  return reply
    .clearCookie("accessToken", { path: "/" })
    .clearCookie("refreshToken", { path: "/" })
    .send({ message: "Logged out" });
}
