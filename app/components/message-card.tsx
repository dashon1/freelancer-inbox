
"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import { 
  Clock, 
  Mail, 
  Reply, 
  MessageSquare, 
  ExternalLink,
  MoreHorizontal,
  Archive,
  Trash2
} from "lucide-react"
import { Message, Platform } from "@/lib/types"
import { getPlatformIcon, getPlatformColor, getInitials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface MessageCardProps {
  message: Message
  onReply?: (messageId: string, content: string) => void
  onMarkAsRead?: (messageId: string) => void
  onArchive?: (messageId: string) => void
  onDelete?: (messageId: string) => void
}

export function MessageCard({ 
  message, 
  onReply, 
  onMarkAsRead, 
  onArchive, 
  onDelete 
}: MessageCardProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message",
        variant: "destructive"
      })
      return
    }

    try {
      onReply?.(message.id, replyContent)
      setReplyContent("")
      setIsReplying(false)
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsRead = () => {
    onMarkAsRead?.(message.id)
    toast({
      title: "Marked as read",
      description: "Message has been marked as read"
    })
  }

  const handleArchive = () => {
    onArchive?.(message.id)
    toast({
      title: "Archived",
      description: "Message has been archived"
    })
  }

  const handleDelete = () => {
    onDelete?.(message.id)
    toast({
      title: "Deleted",
      description: "Message has been deleted"
    })
  }

  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
  const preview = message.content.length > 150 ? 
    message.content.substring(0, 150) + "..." : 
    message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`mb-4 transition-all hover:shadow-md ${
        message.status === 'UNREAD' ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative pointer-events-none">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-600 text-white pointer-events-none">
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {message.senderName}
                  </h3>
                  <Badge className={getPlatformColor(message.platform)} variant="secondary">
                    <span className="mr-1">{getPlatformIcon(message.platform)}</span>
                    {message.platform}
                  </Badge>
                  {message.status === 'UNREAD' && (
                    <Badge variant="default" className="bg-blue-600 text-white">
                      New
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">{timeAgo}</p>
                  {message.client && (
                    <>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">{message.client.company}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {message.status === 'UNREAD' && (
                  <DropdownMenuItem onClick={handleMarkAsRead}>
                    <Mail className="mr-2 h-4 w-4" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {message.subject && (
            <h4 className="text-sm font-medium text-gray-800 mt-2">
              {message.subject}
            </h4>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="mb-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {isExpanded ? message.content : preview}
            </p>
            
            {message.content.length > 150 && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-blue-600 mt-1"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : "Show more"}
              </Button>
            )}
          </div>

          {message.attachments?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((attachment, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Attachment {index + 1}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => setIsReplying(!isReplying)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
              
              {message.replies && message.replies.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {message.replies.length} replies
                </Button>
              )}
            </div>
          </div>

          {isReplying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="mb-3">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setIsReplying(false)
                    setReplyContent("")
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                >
                  Send Reply
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
