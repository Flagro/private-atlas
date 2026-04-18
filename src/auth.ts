import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signInSchema } from "@/lib/validations/auth";

function googleOAuthEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

const googleEnv = googleOAuthEnv();
const providers: Provider[] = [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });

        // User not found or registered via OAuth only (no password)
        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
];

if (googleEnv) {
  providers.push(
    Google({
      clientId: googleEnv.clientId,
      clientSecret: googleEnv.clientSecret,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (account && user) {
        if (account.provider === "google") {
          const email = user.email?.trim();
          if (!email) {
            console.error("[auth] Google profile is missing an email");
            throw new Error("Google account is missing an email address");
          }

          // Atomically find-or-create the DB user for this Google sign-in,
          // then link the OAuth account so subsequent sign-ins work.
          // upsert eliminates the findUnique → create race condition where
          // two concurrent Google sign-ins with the same email could both
          // pass the existence check and collide on insert.
          try {
            let dbUser = await prisma.user.upsert({
              where: { email },
              create: {
                email,
                name: user.name ?? null,
                image: user.image ?? null,
              },
              update: {},
            });

            // Back-fill name / avatar from the provider only when the stored
            // values are still empty (preserves any user-set overrides).
            if ((user.name && !dbUser.name) || (user.image && !dbUser.image)) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  name: dbUser.name ?? user.name ?? null,
                  image: dbUser.image ?? user.image ?? null,
                },
              });
            }

            // Ensure the OAuth account row exists (idempotent)
            await prisma.oAuthAccount.upsert({
              where: {
                provider_providerAccountId: {
                  provider: "google",
                  providerAccountId: account.providerAccountId,
                },
              },
              create: {
                userId: dbUser.id,
                provider: "google",
                providerAccountId: account.providerAccountId,
              },
              update: {},
            });

            token.id = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
          } catch (err) {
            console.error("[auth] Google jwt error:", err);
            throw err;
          }
        } else {
          // Credentials sign-in: user object comes from authorize()
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
      }
      return token;
    },

    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});
