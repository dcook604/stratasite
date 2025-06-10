import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating default admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword
      }
    });

    console.log('Default admin user created:', { id: admin.id, email: admin.email });
    console.log('Login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists!');
    } else {
      console.error('Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();