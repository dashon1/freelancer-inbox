
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { NotificationsPage } from './_components/notifications-page'

export const metadata = {
  title: 'Notifications - FreelancerInbox',
  description: 'View and manage your notifications'
}

export default async function Notifications() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <NotificationsPage />
}
