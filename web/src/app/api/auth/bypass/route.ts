import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@codebuff/internal/db'
import * as schema from '@codebuff/internal/db/schema'
import { eq } from 'drizzle-orm'
import { grantSignupCredits } from '@codebuff/billing'
import { logger } from '@/util/logger'

export async function POST(req: NextRequest) {
  // Chỉ cho phép ở môi trường development để bảo mật
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    // 1. Tìm hoặc tạo user Developer Local
    const email = 'developer@local.test'
    let localUser = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    })

    if (!localUser) {
      const userId = crypto.randomUUID()
      await db.insert(schema.user).values({
        id: userId,
        name: 'Developer Local',
        email,
        stripe_customer_id: 'cus_local_dummy',
      })

      try {
        await grantSignupCredits({
          userId,
          logger,
        })
      } catch (error) {
        logger.error({ userId, error }, 'Bypass auth: Failed to grant signup credits')
      }

      localUser = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      })
    }

    if (!localUser) {
      throw new Error('Failed to create or retrieve local user')
    }

    // 2. Tạo Session mới trong bảng session
    const sessionToken = crypto.randomUUID()
    const expires = new Date()
    expires.setDate(expires.getDate() + 30) // Hết hạn sau 30 ngày

    await db.insert(schema.session).values({
      sessionToken,
      userId: localUser.id,
      expires,
      type: 'web',
    })

    // 3. Đặt cookie session
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      expires,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Local không bắt buộc HTTPS
    })

    return NextResponse.json({ success: true, callbackUrl })
  } catch (error) {
    logger.error({ error }, 'Error during bypass login')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
