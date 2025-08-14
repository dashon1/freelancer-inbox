
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create test user first
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      companyName: 'FreelancerInbox Demo',
    }
  })

  console.log('Created test user:', testUser.email)

  // Create sample clients
  const clients = [
    {
      name: 'Sarah Johnson',
      email: 'sarah@techstartup.com',
      company: 'TechStartup Inc.',
      platform: 'EMAIL',
      notes: 'CEO of a fast-growing startup. Prefers email for formal communications.'
    },
    {
      name: 'Mike Chen',
      email: 'mike.chen@designagency.co',
      company: 'Creative Design Agency',
      platform: 'SLACK',
      notes: 'Creative director who loves quick Slack chats for project updates.'
    },
    {
      name: 'Emily Rodriguez',
      email: 'emily@ecommercestore.com',
      company: 'E-commerce Store',
      platform: 'DISCORD',
      notes: 'Runs an online gaming store. Very active on Discord.'
    },
    {
      name: 'David Kim',
      email: 'david@consultingfirm.biz',
      company: 'Business Consulting Firm',
      platform: 'EMAIL',
      notes: 'Senior consultant who requires detailed project reports via email.'
    },
    {
      name: 'Lisa Thompson',
      email: 'lisa@marketingagency.com',
      company: 'Digital Marketing Agency',
      platform: 'SLACK',
      notes: 'Marketing director who coordinates campaigns through Slack channels.'
    },
    {
      name: 'Alex Wilson',
      email: 'alex@gamedev.studio',
      company: 'GameDev Studio',
      platform: 'DISCORD',
      notes: 'Indie game developer who communicates primarily through Discord.'
    }
  ]

  const createdClients = []
  
  for (const clientData of clients) {
    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: testUser.id,
        email: clientData.email
      }
    })

    let client
    if (existingClient) {
      client = existingClient
      console.log(`Client already exists: ${client.name}`)
    } else {
      client = await prisma.client.create({
        data: {
          userId: testUser.id,
          name: clientData.name,
          email: clientData.email,
          company: clientData.company,
          platform: clientData.platform as 'EMAIL' | 'SLACK' | 'DISCORD',
          notes: clientData.notes
        }
      })
      console.log(`Created client: ${client.name}`)
    }
    
    createdClients.push(client)
  }

  // Create sample messages for each client
  const messageTemplates = [
    // Email messages
    {
      platform: 'EMAIL',
      messages: [
        {
          subject: 'Project Proposal Review',
          content: 'Hi there! I\'ve reviewed your project proposal and I\'m really impressed with your approach. The timeline looks good, but I have a few questions about the technical implementation. Could we schedule a call to discuss the database architecture and API design in more detail? I\'d also like to understand your testing strategy better. Looking forward to hearing from you soon!',
          isFromClient: true
        },
        {
          subject: 'Budget Approval Update',
          content: 'Great news! The budget for the Q4 project has been approved by the board. We can now move forward with the full scope as discussed. The additional features you suggested have also been greenlit. Please send me the updated timeline and we can kick off next week. Thanks for your patience during the approval process.',
          isFromClient: true
        },
        {
          subject: 'Weekly Progress Report',
          content: 'Hope you\'re doing well! Just wanted to get an update on the progress this week. The stakeholders are excited to see the demo next Friday. Is everything on track? Let me know if you need any resources or if there are any blockers I can help remove. Also, don\'t forget about the client presentation next Tuesday.',
          isFromClient: true
        }
      ]
    },
    // Slack messages
    {
      platform: 'SLACK',
      messages: [
        {
          content: 'Hey! Quick question - can you push the design updates by EOD? The client wants to review them first thing tomorrow morning 🚀',
          isFromClient: true
        },
        {
          content: 'Just saw the latest mockups - they look amazing! 🎉 The color scheme is perfect and the user flow is much cleaner now. One small thing: can we make the CTA button slightly larger?',
          isFromClient: true
        },
        {
          content: 'Team meeting at 3 PM today. We\'ll be discussing the final deliverables and timeline adjustments. Please join if you\'re available! 📅',
          isFromClient: true
        },
        {
          content: 'The client loved the prototype demo! 🎊 They\'re ready to move to the next phase. Great work on the presentation. Can we schedule a planning session for next week?',
          isFromClient: true
        }
      ]
    },
    // Discord messages
    {
      platform: 'DISCORD',
      messages: [
        {
          content: 'Yo! The new game mechanics are sick! 🎮 Players are loving the updated combat system. Can we add some more particle effects to the spell casting? That would make it even more epic!',
          isFromClient: true
        },
        {
          content: 'Stream went well last night - got some great feedback from the community! They want more customization options for characters. Think we can squeeze that into the next update? 🔥',
          isFromClient: true
        },
        {
          content: 'Bug report: players are experiencing lag in the multiplayer lobby. Not sure if it\'s server-side or client-side. Can you take a look when you get a chance? 🐛',
          isFromClient: true
        },
        {
          content: 'The soundtrack you made is absolutely perfect! 🎵 It really captures the atmosphere we were going for. The boss fight music gives me chills every time!',
          isFromClient: true
        }
      ]
    }
  ]

  // Create messages for each client
  for (let i = 0; i < createdClients.length; i++) {
    const client = createdClients[i]
    const platformMessages = messageTemplates.find(t => t.platform === client.platform)
    
    if (platformMessages) {
      for (let j = 0; j < platformMessages.messages.length; j++) {
        const msgData = platformMessages.messages[j]
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7)) // Random date within last week
        createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24))

        const message = await prisma.message.create({
          data: {
            userId: testUser.id,
            clientId: client.id,
            platform: client.platform as 'EMAIL' | 'SLACK' | 'DISCORD',
            subject: 'subject' in msgData ? msgData.subject : null,
            content: msgData.content,
            senderName: client.name,
            senderEmail: client.email,
            status: Math.random() > 0.3 ? 'UNREAD' : 'READ', // 70% unread, 30% read
            isFromClient: msgData.isFromClient,
            attachments: [],
            createdAt: createdAt
          }
        })

        console.log(`Created message from ${client.name}`)

        // Add some replies to certain messages
        if (Math.random() > 0.7) { // 30% chance of having a reply
          const replyCreatedAt = new Date(createdAt)
          replyCreatedAt.setMinutes(replyCreatedAt.getMinutes() + Math.floor(Math.random() * 120) + 30)

          await prisma.reply.create({
            data: {
              userId: testUser.id,
              messageId: message.id,
              content: client.platform === 'EMAIL' 
                ? 'Thanks for your message! I\'ll review this and get back to you with detailed feedback by tomorrow.'
                : client.platform === 'SLACK'
                ? 'Sure thing! I\'ll get that sorted for you 👍'
                : 'Awesome! Let me check that out and push an update soon! 🚀',
              sentAt: replyCreatedAt
            }
          })

          console.log(`Created reply for message from ${client.name}`)
        }
      }
    }
  }

  // Create some notifications
  const messages = await prisma.message.findMany({
    where: { userId: testUser.id },
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  for (const message of messages) {
    if (Math.random() > 0.5) { // 50% chance of having a notification
      await prisma.notification.create({
        data: {
          userId: testUser.id,
          messageId: message.id,
          type: 'NEW_MESSAGE',
          title: `New message from ${message.senderName}`,
          content: message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content,
          isRead: Math.random() > 0.6 // 40% read, 60% unread
        }
      })
    }
  }

  console.log('Database seeding completed successfully!')
  console.log('\nTest Account Details:')
  console.log('Email: john@doe.com')
  console.log('Password: johndoe123')
  console.log(`\nCreated ${createdClients.length} clients with sample messages and replies.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
