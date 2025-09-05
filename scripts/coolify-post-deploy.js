import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const formConfigurations = [
  {
    formName: 'scooter-registration',
    displayName: 'E-Scooter Registration',
    description: 'Registration form for e-scooter storage in the parkade',
    isActive: true,
    emailConfig: {
      subject: 'New E-Scooter Registration - Unit {{unitNumber}}',
      fromName: 'Spectrum 4 E-Scooter Registration',
      template: 'scooter-registration'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'jen.danczak@gmail.com', name: 'Jennifer Danczak', isPrimary: false, isActive: true }
    ]
  },
  {
    formName: 'ac-inquiry',
    displayName: 'AC Installation Inquiry',
    description: 'Inquiry form for air conditioning installation',
    isActive: true,
    emailConfig: {
      subject: 'New AC Installation Inquiry - Unit {{ownerUnit}}',
      fromName: 'Spectrum 4 AC Inquiry',
      template: 'ac-inquiry'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'info@airlux.ca', name: 'Airlux Info', isPrimary: false, isActive: true }
    ]
  },
  {
    formName: 'storage-rental',
    displayName: 'Storage Rental Interest',
    description: 'Interest form for storage rental inquiries',
    isActive: true,
    emailConfig: {
      subject: 'New Storage Rental Interest - Unit {{unitNumber}}',
      fromName: 'Spectrum 4 Storage Rental',
      template: 'storage-rental'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'abrajlovic@ascentpm.com', name: 'Ascent PM', isPrimary: false, isActive: true },
      { email: 'jennifer.danczak@spectrum4.ca', name: 'Jennifer Danczak', isPrimary: false, isActive: true },
      { email: 'hercules@spectrum4.ca', name: 'Hercules', isPrimary: false, isActive: true }
    ]
  },
  {
    formName: 'emergency-contact',
    displayName: 'Emergency Contact Information',
    description: 'Emergency contact information form for residents',
    isActive: true,
    emailConfig: {
      subject: 'Emergency Contact Information - Unit {{unitNumber}}',
      fromName: 'Spectrum 4 Emergency Contact',
      template: 'emergency-contact'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'abrajlovic@ascentpm.com', name: 'Ascent PM', isPrimary: false, isActive: true },
      { email: 'jennifer.danczak@spectrum4.ca', name: 'Jennifer Danczak', isPrimary: false, isActive: true },
      { email: 'hercules@spectrum4.ca', name: 'Hercules', isPrimary: false, isActive: true }
    ]
  },
  {
    formName: 'pet-registration',
    displayName: 'Pet Registration',
    description: 'Pet registration form for residents',
    isActive: true,
    emailConfig: {
      subject: 'New Pet Registration - {{petName}} (Unit {{suiteNumber}})',
      fromName: 'Spectrum 4 Pet Registration',
      template: 'pet-registration'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'abrajlovic@ascentpm.com', name: 'Ascent PM', isPrimary: false, isActive: true },
      { email: 'jennifer.danczak@spectrum4.ca', name: 'Jennifer Danczak', isPrimary: false, isActive: true },
      { email: 'hercules@spectrum4.ca', name: 'Hercules', isPrimary: false, isActive: true }
    ]
  }
];

async function setupFormManagement() {
  console.log('🚀 Setting up Form Management System for Coolify deployment...');
  
  try {
    // Check if form configurations already exist
    const existingConfigs = await prisma.formConfiguration.findMany();
    if (existingConfigs.length > 0) {
      console.log('✅ Form configurations already exist, skipping seed');
      return;
    }
    
    console.log('🌱 Seeding form configurations...');
    
    // Create form configurations with recipients
    for (const config of formConfigurations) {
      const { recipients, ...configData } = config;
      
      const formConfig = await prisma.formConfiguration.create({
        data: configData
      });
      
      // Create recipients for this form
      for (const recipient of recipients) {
        await prisma.formEmailRecipient.create({
          data: {
            ...recipient,
            formConfigId: formConfig.id
          }
        });
      }
      
      console.log(`✅ Created form configuration: ${config.displayName}`);
    }
    
    console.log('🎉 Form Management System setup completed successfully!');
    console.log('📋 Pre-configured forms:');
    formConfigurations.forEach(config => {
      console.log(`  • ${config.displayName} (${config.recipients.length} recipients)`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up Form Management System:', error);
    // Don't throw error to prevent deployment failure
    console.log('⚠️  Continuing deployment without form management setup...');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupFormManagement()
  .then(() => {
    console.log('✅ Coolify post-deploy setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Coolify post-deploy setup failed:', error);
    process.exit(0); // Don't fail deployment
  });
