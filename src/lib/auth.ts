import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAuditLog } from "@/lib/actions/audit";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: false,
      maxAge: 5 * 60,
    },
    additionalFields: {
      activeStoreId: {
        type: "string",
        required: false,
      },
      activeEmployeeProfileId: {
        type: "string",
        required: false,
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "owner",
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const s = session as unknown as { userId: string };
          const user = await db
            .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
            .from(schema.users)
            .where(eq(schema.users.id, s.userId))
            .limit(1);

          if (user[0]) {
            createAuditLog({
              userName: user[0].name || "Unknown",
              action: "login",
              detail: `${user[0].name || user[0].email} berhasil login`,
              metadata: { email: user[0].email },
            }).catch(() => {});
          }

        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
