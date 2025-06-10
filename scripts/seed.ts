import { createAdminUser } from '../src/lib/auth';

async function main() {
  try {
    console.log('Creating default admin user...');
    
    const admin = await createAdminUser('admin@example.com', 'admin123');
    
    console.log('Default admin user created:', admin);
    console.log('Login credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists!');
    } else {
      console.error('Error creating admin user:', error);
    }
  }
}

main();