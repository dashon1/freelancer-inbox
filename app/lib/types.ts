
import { Platform, MessageStatus, NotificationType } from '@prisma/client'

export { Platform, MessageStatus, NotificationType }

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  userId: string
  name: string
  email: string
  company?: string
  platform: Platform
  avatar?: string
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  userId: string
  clientId: string
  platform: Platform
  subject?: string
  content: string
  senderName: string
  senderEmail?: string
  status: MessageStatus
  isFromClient: boolean
  externalId?: string
  threadId?: string
  attachments: string[]
  createdAt: Date
  updatedAt: Date
  client?: Client
  replies?: Reply[]
}

export interface Reply {
  id: string
  userId: string
  messageId: string
  content: string
  sentAt: Date
  user?: User
}

export interface Notification {
  id: string
  userId: string
  messageId?: string
  type: NotificationType
  title: string
  content?: string
  isRead: boolean
  createdAt: Date
  message?: Message
}

export interface UnifiedMessage extends Message {
  platformIcon: string
  platformColor: string
  timeAgo: string
  preview: string
}
