import bcrypt from 'bcryptjs';
import { prisma } from './database';

export async function validateAdminCredentials(email: string, password: string) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email
    };
  } catch (error) {
    console.error('Error validating admin credentials:', error);
    return null;
  }
}

export async function createAdminUser(email: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    return {
      id: admin.id,
      email: admin.email
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}