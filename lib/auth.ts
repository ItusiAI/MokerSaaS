import { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { giveRegisterBonus } from '@/lib/points'
import {
  findAffiliateByCode,
  getOrCreateAffiliateProfile,
  createAffiliateRelation,
} from '@/lib/affiliate'
import { cookies } from 'next/headers'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// 扩展NextAuth类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: {
    ...DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    
    // 重写createUser方法以提供ID生成
    async createUser(user: {
      name?: string | null
      email: string
      emailVerified?: Date | null
      image?: string | null
    }) {
      try {
        const id = nanoid()
        
        console.log('创建新用户开始:', {
          id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          hasImage: !!user.image
        })
        
        // 对于OAuth登录，如果没有邮箱，生成一个临时邮箱
        let userEmail = user.email
        if (!userEmail) {
          userEmail = `${id}@oauth.local`
          console.log('生成临时邮箱:', userEmail)
        }
        
        // 检查邮箱是否已存在
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, userEmail)
        })
        
        if (existingUser) {
          console.log('邮箱已存在，返回现有用户:', existingUser.id)
          return existingUser
        }
        
        console.log('插入新用户到数据库...')
        const newUser = await db.insert(users).values({
          id,
          name: user.name,
          email: userEmail,
          emailVerified: user.emailVerified || new Date(), // OAuth用户自动验证邮箱
          image: user.image,
        }).returning()
        
        console.log('数据库插入成功:', newUser[0])
        
        // 为新用户赠送注册积分
        try {
          await giveRegisterBonus(id)
          console.log(`新用户 ${id} 通过第三方登录注册成功，已赠送注册积分`)
        } catch (pointsError) {
          console.error('第三方注册赠送积分失败:', pointsError)
          // 积分赠送失败不影响用户创建流程
        }
        
        // ========== 处理推广返利系统（完全独立于推荐系统） ==========
        // 从 Cookie 中读取推广码（?aff={affiliateCode}）
        try {
          const cookieStore = await cookies()
          const affiliateCodeFromCookie = cookieStore.get('aff')?.value

          if (affiliateCodeFromCookie) {
            // 查找推广人
            const affiliateInfo = await findAffiliateByCode(affiliateCodeFromCookie.trim())
            
            if (affiliateInfo) {
              // 确保推广人资料存在
              const affiliateProfileId = await getOrCreateAffiliateProfile(affiliateInfo.userId)
              
              // 创建推广关系（30天有效期）
              await createAffiliateRelation(affiliateProfileId, id)
              
              console.log(`新用户 ${id} 通过第三方登录注册成功，已创建推广关系`)
            }
          }
        } catch (affiliateError) {
          console.error('第三方注册处理推广关系失败:', affiliateError)
          // 推广关系处理失败不影响用户创建流程
        }
        
        return newUser[0]
      } catch (error) {
        console.error('创建用户失败:', error)
        console.error('用户创建错误详情:', {
          message: error instanceof Error ? error.message : '未知错误',
          stack: error instanceof Error ? error.stack : undefined,
          userData: {
            name: user.name,
            email: user.email,
            hasImage: !!user.image
          }
        })
        throw error
      }
    }
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email)
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        console.log('OAuth登录回调开始:', {
          provider: account?.provider,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          hasImage: !!user.image
        })
        
        // 对于OAuth提供商，自动验证邮箱
        if (account && account.provider !== 'credentials') {
          console.log(`用户通过 ${account.provider} 登录:`, {
            id: user.id,
            name: user.name,
            email: user.email,
            provider: account.provider
          })
          
          return true
        }
        return true
      } catch (error) {
        console.error('登录回调错误:', error)
        console.error('回调错误详情:', {
          message: error instanceof Error ? error.message : '未知错误',
          stack: error instanceof Error ? error.stack : undefined,
          provider: account?.provider,
          userId: user?.id,
          userName: user?.name,
          userEmail: user?.email
        })
        return false
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} 