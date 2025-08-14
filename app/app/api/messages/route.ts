
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: session.user.id
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (platform && platform !== 'ALL') {
      where.platform = platform
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        client: true,
        replies: {
          orderBy: { sentAt: 'asc' },
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.message.count({ where })

    return NextResponse.json({
      messages,
      totalCount,
      hasMore: totalCount > offset + limit
    })

  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
