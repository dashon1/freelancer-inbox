
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { InboxDashboard } from './_components/inbox-dashboard'

export const metadata = {
  title: 'Inbox - FreelancerInbox',
  description: 'Unified inbox for all your client communications'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <InboxDashboard />
}
