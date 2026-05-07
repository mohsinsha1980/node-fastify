import { FastifyReply } from "fastify";

export async function generateTokens(
  reply: FastifyReply,
  email: string,
  refreshVersion = 0,
) {
  const accessToken = await reply.jwtSign({ email }, { expiresIn: "15m" });
  const refreshToken = await reply.jwtSign(
    { email, version: refreshVersion },
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
}

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
  secure = false,
) {
  return reply
    .setCookie("accessToken", accessToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "strict" : "lax",
      path: "/",
      maxAge: 15 * 60,
    })
    .setCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "strict" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
}
