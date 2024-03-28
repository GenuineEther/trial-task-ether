import { type GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/server/db";
import bcrypt from "bcrypt";
import {
  type AuthUser,
  jwtHelper,
  tokenOneDay,
  tokenOnWeek,
} from "@/utils/jwtHelper";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  providers: [
    CredentialsProvider({
      id: "next-auth",
      async authorize(credentials) {
        try {
          const user = await db.user.findFirst({
            where: {
              email: credentials?.email,
            },
          });

          if (user && credentials) {
            const validPassword = await bcrypt.compare(
              credentials?.password,
              user.password,
            );

            if (validPassword) {
              return {
                id: user.id,
                email: user.email,
              };
            }
          } else if (!user && credentials) {
            const isUser = await db.user.findFirst({
              where: {
                email: credentials.email,
              },
            });

            if (!isUser) {
              const hashPassword = await bcrypt.hash(credentials.password, 10);
              const newUser = await db.user.create({
                data: {
                  name: credentials.name,
                  email: credentials.email,
                  password: hashPassword,
                },
              });

              return {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
              };
            }
          }
        } catch (error) {
          console.log(error);
        }
        return null;
      },
      credentials: {
        name: {
          label: "Username",
          type: "text",
          placeholder: "Please enter username",
        },
        email: {
          label: "Email Address",
          type: "text",
          placeholder: "Please enter email address",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "xxxx-xxxx-xxxx",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // credentials provider:  Save the access token and refresh token in the JWT on the initial login
      if (user) {
        const authUser = { id: user.id, email: user.email } as AuthUser;

        const accessToken = await jwtHelper.createAcessToken(authUser);
        const refreshToken = await jwtHelper.createRefreshToken(authUser);
        const accessTokenExpired = Date.now() / 1000 + tokenOneDay;
        const refreshTokenExpired = Date.now() / 1000 + tokenOnWeek;

        return {
          ...token,
          accessToken,
          refreshToken,
          accessTokenExpired,
          refreshTokenExpired,
          user: authUser,
        };
      } else {
        if (token) {
          // If the access token has expired, try to refresh it
          if (Date.now() / 1000 > token.accessTokenExpired) {
            const verifyToken = await jwtHelper.verifyToken(token.refreshToken);

            if (verifyToken) {
              const user = await db.user.findFirst({
                where: {
                  email: token.user.email,
                },
              });

              if (user) {
                const accessToken = await jwtHelper.createAcessToken(
                  token.user,
                );
                const accessTokenExpired = Date.now() / 1000 + tokenOneDay;

                return { ...token, accessToken, accessTokenExpired };
              }
            }

            return { ...token, error: "RefreshAccessTokenError" };
          }
        }
      }

      return token;
    },

    async session({ session, user }) {
      if (user) {
        session.user = {
          name: user.name,
          email: user?.email,
          userId: user?.id,
        };
      }
      return session;
    },
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
