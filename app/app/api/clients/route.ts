
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { validateEmail } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const platform = searchParams.get('platform')

    const where: any = {
      userId: session.user.id,
      isActive: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (platform && platform !== 'ALL') {
      where.platform = platform
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: { status: 'UNREAD' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(clients)

  } catch (error) {
    console.error("Get clients error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, company, platform, notes } = await request.json()

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    if (!platform || !['EMAIL', 'SLACK', 'DISCORD'].includes(platform)) {
      return NextResponse.json(
        { error: "Valid platform is required" },
        { status: 400 }
      )
    }

    // Check if client already exists for this user
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        email,
        isActive: true
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 }
      )
    }

    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        email,
        company: company?.trim() || null,
        platform,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(client, { status: 201 })

  } catch (error) {
    console.error("Create client error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
