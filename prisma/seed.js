import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function generateNik() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString()
}

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  await prisma.users.createMany({
    data: [
      {
        name: 'Owner',
        nik: generateNik(),
        email: 'owner@gmail.com',
        password: hashedPassword,
        role: 'OWNER',
      },
    ],
    skipDuplicates: true,
  })

  console.log('Owner berhasil ditambahkan')
}

main()
  .catch((e) => {
    console.error(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })