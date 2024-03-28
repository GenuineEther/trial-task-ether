import { encode, decode } from "next-auth/jwt";
import { type User } from "@prisma/client";
import { env } from "@/env";

export type AuthUser = Omit<User, "Password">;

export const tokenOneDay = 24 * 60 * 60;
export const tokenOnWeek = tokenOneDay * 7;

const createJWT = (token: AuthUser | string, duration: number) =>
  encode({ token, secret: env.NEXTAUTH_JWT_SECRET, maxAge: duration });

export const jwtHelper = {
  createAcessToken: (token: AuthUser) => createJWT(token, tokenOneDay),
  createRefreshToken: (token: AuthUser) => createJWT(token, tokenOnWeek),
  verifyToken: (token: string) =>
    decode({ token, secret: env.NEXTAUTH_JWT_SECRET }),
};
