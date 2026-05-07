import bcrypt from "bcrypt";
import { FastifyReply } from "fastify";
import { User } from "../user/user.model.js";
import { generateTokens, setAuthCookies } from "../../plugins/helper.js";

export async function createAuthSession(
  reply: FastifyReply,
  email: string,
  isSecureCookie: boolean,
) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const refreshVersion = user.refreshTokenVersion ?? 0;
  const { accessToken, refreshToken } = await generateTokens(
    reply,
    email,
    refreshVersion,
  );

  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await user.save();

  setAuthCookies(reply, accessToken, refreshToken, isSecureCookie);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyRefreshToken(token: string, hash: string) {
  return bcrypt.compare(token, hash);
}
