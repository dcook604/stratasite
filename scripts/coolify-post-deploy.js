import { getPrisma } from '../server/utils/prisma.js';

const prisma = getPrisma();

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
  },
  {
    formName: 'form-k',
    displayName: 'Form K - Notice of Tenant\'s Responsibilities',
    description: 'Strata Property Act Form K for tenant notification',
    isActive: true,
    emailConfig: {
      subject: 'New Form K Submission - Unit {{unitNumber}} - Notice of Tenant\'s Responsibilities',
      fromName: 'Spectrum 4 Form K',
      template: 'form-k'
    },
    recipients: [
      { email: 'dcook@spectrum4.ca', name: 'David Cook', isPrimary: true, isActive: true },
      { email: 'abrajlovic@ascentpm.com', name: 'Ascent PM', isPrimary: false, isActive: true },
      { email: 'jennifer.danczak@spectrum4.ca', name: 'Jennifer Danczak', isPrimary: false, isActive: true },
      { email: 'hercules@spectrum4.ca', name: 'Hercules', isPrimary: false, isActive: true }
    ]
  },
  {
    formName: 'incident-report',
    displayName: 'Incident Report',
    description: 'Report incidents occurring on the strata property',
    isActive: true,
    emailConfig: {
      subject: '⚠️ Incident Report - {{incidentTitle}} (Unit {{unitNumber}})',
      fromName: 'Spectrum 4 Incident Report',
      template: 'incident-report'
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
    // Upsert each form config individually so new forms are always added
    for (const config of formConfigurations) {
      const { recipients, ...configData } = config;

      const existing = await prisma.formConfiguration.findUnique({
        where: { formName: config.formName }
      });

      if (existing) {
        console.log(`⏭️  Form configuration already exists: ${config.displayName}`);
        continue;
      }

      const formConfig = await prisma.formConfiguration.create({
        data: configData
      });

      for (const recipient of recipients) {
        await prisma.formEmailRecipient.create({
          data: { ...recipient, formConfigId: formConfig.id }
        });
      }

      console.log(`✅ Created form configuration: ${config.displayName}`);
    }

    console.log('🎉 Form Management System setup completed successfully!');

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
