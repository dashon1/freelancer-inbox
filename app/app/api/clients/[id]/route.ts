
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { validateEmail } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          include: {
            replies: {
              orderBy: { sentAt: 'asc' }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(client)

  } catch (error) {
    console.error("Get client error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, company, platform, notes } = await request.json()

    // Validation
    if (name && !name.trim()) {
      return NextResponse.json(
        { error: "Client name cannot be empty" },
        { status: 400 }
      )
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    if (platform && !['EMAIL', 'SLACK', 'DISCORD'].includes(platform)) {
      return NextResponse.json(
        { error: "Valid platform is required" },
        { status: 400 }
      )
    }

    // Verify client belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Check for email conflicts if email is being updated
    if (email && email !== existingClient.email) {
      const emailConflict = await prisma.client.findFirst({
        where: {
          userId: session.user.id,
          email,
          isActive: true,
          id: { not: params.id }
        }
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: "Client with this email already exists" },
          { status: 409 }
        )
      }
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email }),
        ...(company !== undefined && { company: company?.trim() || null }),
        ...(platform && { platform }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      }
    })

    return NextResponse.json(updatedClient)

  } catch (error) {
    console.error("Update client error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    // Soft delete - mark as inactive
    await prisma.client.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Delete client error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
