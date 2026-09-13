import NextAuth from 'next-auth';
import { UserRole } from '@vargah/database';
import { ACCESS_TOKEN_MAX_AGE } from '@vargah/security/token-constants';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    picture?: string | null;
    twoFactorEnabled?: boolean;
  }
}

/** Session از کوکی JWT ست‌شده توسط /api/auth/login خوانده می‌شود */
export const { handlers, auth, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: ACCESS_TOKEN_MAX_AGE },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as UserRole;
      if (token.email) session.user.email = token.email as string;
      if (token.name) session.user.name = token.name as string;
      session.user.image = (token.picture as string | undefined) ?? null;
      return session;
    },
  },
});
