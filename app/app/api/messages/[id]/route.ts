
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!status || !['READ', 'UNREAD', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Verify the message belongs to the user
    const message = await prisma.message.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    // Update message status
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: { status },
      include: {
        client: true,
        replies: {
          orderBy: { sentAt: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedMessage)

  } catch (error) {
    console.error("Update message error:", error)
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

    // Verify the message belongs to the user
    const message = await prisma.message.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    // Delete message (cascade will handle replies and notifications)
    await prisma.message.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Delete message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
