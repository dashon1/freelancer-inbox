
"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Inbox, 
  Filter, 
  Search, 
  RefreshCw, 
  Plus,
  Mail,
  MailOpen,
  Archive
} from 'lucide-react'
import { MessageCard } from '@/components/message-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Message, UnifiedMessage } from '@/lib/types'

export function InboxDashboard() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<UnifiedMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0
  })
  
  const { data: session } = useSession()
  const { toast } = useToast()

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
        platform: platformFilter,
        limit: '50'
      })
      
      const response = await fetch(`/api/messages?${params}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const data = await response.json()
      
      // Transform messages to include UI-specific properties
      const transformedMessages: UnifiedMessage[] = data.messages.map((msg: Message) => ({
        ...msg,
        platformIcon: getPlatformIcon(msg.platform),
        platformColor: getPlatformColor(msg.platform),
        timeAgo: formatTimeAgo(new Date(msg.createdAt)),
        preview: getMessagePreview(msg.content, 150)
      }))
      
      setMessages(transformedMessages)
      
      // Calculate stats
      const newStats = {
        total: data.totalCount,
        unread: transformedMessages.filter(m => m.status === 'UNREAD').length,
        read: transformedMessages.filter(m => m.status === 'READ').length,
        archived: transformedMessages.filter(m => m.status === 'ARCHIVED').length
      }
      setStats(newStats)
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReply = async (messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error('Failed to send reply')

      // Refresh messages to get updated state
      await fetchMessages()
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      })
      throw error
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'READ' }),
      })

      if (!response.ok) throw new Error('Failed to mark as read')

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'READ' as const } : msg
        )
      )
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive"
      })
      throw error
    }
  }

  const handleArchive = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })

      if (!response.ok) throw new Error('Failed to archive message')

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'ARCHIVED' as const } : msg
        )
      )
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive"
      })
      throw error
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete message')

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      })
      throw error
    }
  }

  // Filter messages based on search and filters
  useEffect(() => {
    let filtered = messages

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(query) ||
        msg.senderName.toLowerCase().includes(query) ||
        msg.subject?.toLowerCase().includes(query) ||
        msg.client?.name.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(msg => msg.status === statusFilter)
    }

    if (platformFilter !== 'ALL') {
      filtered = filtered.filter(msg => msg.platform === platformFilter)
    }

    setFilteredMessages(filtered)
  }, [messages, searchQuery, statusFilter, platformFilter])

  useEffect(() => {
    fetchMessages()
  }, [statusFilter, platformFilter])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'EMAIL': return '📧'
      case 'SLACK': return '💬'
      case 'DISCORD': return '🎮'
      default: return '📱'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'EMAIL': return 'bg-blue-100 text-blue-800'
      case 'SLACK': return 'bg-purple-100 text-purple-800'
      case 'DISCORD': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  const getMessagePreview = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Inbox className="mr-3 h-7 w-7" />
            Unified Inbox
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all your client communications in one place
          </p>
        </div>
        
        <Button 
          onClick={fetchMessages}
          className="mt-4 sm:mt-0"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <MailOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages, senders, or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Platforms</SelectItem>
                  <SelectItem value="EMAIL">📧 Email</SelectItem>
                  <SelectItem value="SLACK">💬 Slack</SelectItem>
                  <SelectItem value="DISCORD">🎮 Discord</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'ALL' || platformFilter !== 'ALL' 
                  ? 'No messages match your filters'
                  : 'No messages yet'
                }
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'ALL' || platformFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Messages from your clients will appear here'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <MessageCard
                  message={message}
                  onReply={handleReply}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
