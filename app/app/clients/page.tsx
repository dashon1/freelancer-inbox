
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ClientManagement } from './_components/client-management'

export const metadata = {
  title: 'Clients - FreelancerInbox',
  description: 'Manage your client contacts and communication preferences'
}

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <ClientManagement />
}
