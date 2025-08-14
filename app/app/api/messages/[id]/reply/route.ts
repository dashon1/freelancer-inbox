
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Reply content is required" },
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

    // Create reply
    const reply = await prisma.reply.create({
      data: {
        userId: session.user.id,
        messageId: params.id,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Mark message as read if it was unread
    if (message.status === 'UNREAD') {
      await prisma.message.update({
        where: { id: params.id },
        data: { status: 'READ' }
      })
    }

    // Create notification for reply sent
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        messageId: params.id,
        type: 'REPLY_RECEIVED',
        title: 'Reply sent',
        content: `Your reply to ${message.senderName} has been sent`,
        isRead: true // Mark as read since user just sent it
      }
    })

    return NextResponse.json(reply, { status: 201 })

  } catch (error) {
    console.error("Reply error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
