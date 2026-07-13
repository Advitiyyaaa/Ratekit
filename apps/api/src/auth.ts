import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import mongoose from 'mongoose';

/**
 * Factory that creates the BetterAuth instance with the full plugin config.
 * Extracted so TypeScript can infer the exact return type (including the admin
 * plugin's extended User fields: banned, role, banReason, banExpires).
 * Using ReturnType<typeof betterAuth> directly loses those plugin-specific types.
 */
function createAuthInstance() {
  const client = mongoose.connection.getClient();
  return betterAuth({
    secret: process.env['BETTER_AUTH_SECRET'],
    baseURL: process.env['BETTER_AUTH_URL'] ?? 'http://localhost:3001',
    database: mongodbAdapter(client.db()),
    emailAndPassword: {
      enabled: true,
      // Email auto-verified for local dev — no mail transport required.
      // Set requireEmailVerification: true + add emailVerification config
      // once a provider (Resend, Nodemailer…) is wired up.
      requireEmailVerification: false,
      autoSignIn: true,
    },
    plugins: [
      admin({
        // Default role for new users. Promote to "admin" via the admin panel
        // or directly in MongoDB: db.users.updateOne({email:...}, {$set:{role:"admin"}})
        defaultRole: 'user',
      }),
    ],
    trustedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
  });
}

// Type is inferred from createAuthInstance() — includes the admin plugin's
// extended user type. Must be called after connectDatabase().
let _auth: ReturnType<typeof createAuthInstance> | null = null;

/**
 * Returns the BetterAuth singleton. Must be called after connectDatabase()
 * so that mongoose.connection.getClient() is available.
 */
export function getAuth(): ReturnType<typeof createAuthInstance> {
  if (!_auth) {
    _auth = createAuthInstance();
  }
  return _auth;
}
