
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Platform } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPlatformIcon(platform: Platform): string {
  switch (platform) {
    case 'EMAIL':
      return '📧'
    case 'SLACK':
      return '💬'
    case 'DISCORD':
      return '🎮'
    default:
      return '📱'
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'EMAIL':
      return 'bg-blue-100 text-blue-800'
    case 'SLACK':
      return 'bg-purple-100 text-purple-800'
    case 'DISCORD':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getMessagePreview(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
