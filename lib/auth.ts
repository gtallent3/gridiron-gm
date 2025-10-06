import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
export const { handlers: { GET, POST }, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'League Credentials',
      credentials: {
        platform: { label: 'Platform', type: 'text', placeholder: 'sleeper|espn|yahoo' },
        identifier: { label: 'Identifier', type: 'text', placeholder: 'user/league id or cookie' },
        token: { label: 'Token', type: 'password', placeholder: 'optional api token' }
      },
      authorize: async (creds) => {
        if (!creds?.platform || !creds.identifier) return null
        return { id: `${creds.platform}:${creds.identifier}`, name: `GG-${creds.platform}` }
      }
    })
  ],
  session: { strategy: 'jwt' }
})
