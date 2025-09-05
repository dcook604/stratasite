const { PrismaClient } = require('@prisma/client');
const { seedFormConfigurations } = require('./seed-form-configurations');

const prisma = new PrismaClient();

async function setupFormManagement() {
  console.log('🚀 Setting up Form Management System...');
  
  try {
    // Step 1: Generate Prisma client (if needed)
    console.log('📦 Generating Prisma client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Step 2: Push schema to database
    console.log('🗄️ Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Step 3: Seed form configurations
    console.log('🌱 Seeding form configurations...');
    await seedFormConfigurations();
    
    console.log('✅ Form Management System setup completed successfully!');
    console.log('');
    console.log('📋 What was set up:');
    console.log('  • Database schema for form configurations');
    console.log('  • Email recipient management');
    console.log('  • Pre-configured forms with current email addresses');
    console.log('  • Admin interface for form management');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Restart your server to load the new API endpoints');
    console.log('  2. Access the admin dashboard and go to "Form Management"');
    console.log('  3. Configure email recipients for each form');
    console.log('  4. Test form submissions to verify email delivery');
    
  } catch (error) {
    console.error('❌ Error setting up Form Management System:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupFormManagement()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupFormManagement };
