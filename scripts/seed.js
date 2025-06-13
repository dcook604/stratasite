import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const pages = [
  {
    slug: 'homepage',
    title: 'Homepage Content',
    content: `# Welcome to Spectrum 4

A modern platform for our community Vancouver Community to stay informed, connected, and engaged.

## Building Features
Our building offers state-of-the-art amenities and a vibrant community atmosphere.

## Stay Connected
Use our platform to stay updated on events, announcements, and community activities.

## Contact Information
For any questions or concerns, please reach out to the Spectrum 4 Council.`
  },
  {
    slug: 'fees',
    title: 'Strata Fees & Payments',
    content: `# Strata Fees & Payments

Information about strata fees, payment methods, and special assessments.

## Monthly Strata Fees
Strata fees are due on the 1st of each month and cover building maintenance, insurance, utilities for common areas, and contributions to the contingency reserve fund.

## Payment Methods
- Pre-authorized debit (recommended)
- Online banking (use your unit number as reference)
- Cheques (payable to "Strata Corporation XYZ")
- Credit card payments through the resident portal (3% convenience fee applies)

## Late Payments
Payments received after the 5th of the month are subject to a $50 late fee. Outstanding balances may also accrue interest at a rate of 10% per annum.

## Special Assessments
Occasionally, special assessments may be levied for major repairs or improvements that cannot be covered by the contingency reserve fund. Owners will be notified well in advance of any special assessments.

## Fee Schedule
| Fee Type | Amount | Notes |
|----------|--------|-------|
| Move-in Fee | $200 | Non-refundable |
| Move-out Fee | $200 | Non-refundable |
| Amenity Booking | $50 | Per 4-hour block |
| FOB Replacement | $75 | Per FOB |

**Important Notice:** If you're experiencing financial difficulties, please contact the strata manager to discuss payment arrangements before your account falls into arrears.`
  },
  {
    slug: 'bylaws',
    title: 'Building Bylaws',
    content: `# Building Bylaws

Our building bylaws govern the day-to-day operations and resident conduct within our strata community.

## Key Bylaws

### Noise Policy
Quiet hours are from 10:00 PM to 8:00 AM on weekdays and 10:00 PM to 9:00 AM on weekends.

### Pet Policy
- Maximum 2 pets per unit
- Dogs must be leashed in common areas
- Pet waste must be cleaned up immediately

### Common Area Usage
- Pool and fitness center hours: 6:00 AM to 10:00 PM
- Amenity bookings available through the resident portal
- No glass containers in pool area

### Parking and Storage
- One assigned parking spot per unit
- Guest parking available on first-come basis
- No storage in hallways or emergency exits`
  },
  {
    slug: 'contact',
    title: 'Contact Information',
    content: `# Contact Information

## Strata Management
**ABC Property Management**
Phone: (604) 555-0123
Email: info@abcproperty.com
Office Hours: Monday-Friday, 9:00 AM - 5:00 PM

## Emergency Contacts
**24/7 Emergency Line:** (604) 555-0911
**Building Security:** (604) 555-0456

## Maintenance Requests
Submit maintenance requests through:
- Resident portal: www.abcproperty.com/portal
- Phone: (604) 555-0123
- Email: maintenance@abcproperty.com

## Strata Council
Email: council@ourbuilding.com
Monthly meetings: First Thursday of each month at 7:00 PM`
  },
  {
    slug: 'recycling',
    title: 'Recycling & Waste',
    content: `# Recycling & Waste Management

## Collection Schedule
- **Garbage:** Tuesdays and Fridays
- **Recycling:** Wednesdays
- **Organics:** Mondays and Thursdays

## Recycling Guidelines
### Paper & Cardboard
- Newspapers, magazines, office paper
- Cardboard boxes (flattened)
- Paper packaging

### Containers
- Plastic containers #1-7
- Glass bottles and jars
- Metal cans and foil

## Special Disposal
### Electronics
Monthly e-waste pickup - first Saturday of each month

### Hazardous Materials
Quarterly hazardous waste collection - contact management for dates

## Bulk Item Disposal
Contact management to arrange pickup for large items. Additional fees may apply.`
  },
  {
    slug: 'organics',
    title: 'Organics Program',
    content: `# Organics Program

Our building participates in the municipal organics recycling program to reduce waste and support environmental sustainability.

## What Goes in Organics
### Food Scraps
- Fruit and vegetable peels
- Meat, fish, and bones
- Dairy products
- Bread and grains

### Yard Waste
- Leaves and grass clippings
- Small branches and twigs
- Garden trimmings

### Other Organic Materials
- Paper towels and napkins
- Coffee grounds and filters
- Tea bags

## Collection Days
Organics are collected **Mondays and Thursdays**. Place bins in the designated area by 7:00 AM.

## Tips for Success
- Use compostable bags or line bins with newspaper
- Keep bins clean to prevent odors
- Freeze smelly items until collection day`
  },
  {
    slug: 'renovations',
    title: 'Renovations & Alterations',
    content: `# Renovations & Alterations

All renovations and alterations require approval from the Strata Council before work begins.

## Approval Process
1. Submit renovation application with detailed plans
2. Provide proof of insurance and contractor licensing
3. Pay applicable deposits and fees
4. Wait for written approval before starting work

## Permitted Hours
**Monday - Friday:** 8:00 AM to 6:00 PM
**Saturday:** 9:00 AM to 5:00 PM
**Sunday and Holidays:** No construction work

## Common Renovations
### Flooring
- Hardwood, laminate, and tile installations require sound dampening
- Carpet removal and installation permitted

### Kitchen & Bathroom
- Cosmetic updates generally approved
- Plumbing changes require additional review

### Electrical & Plumbing
- Licensed contractors required
- Permits must be obtained from the city

## Deposits
- General renovation deposit: $500
- Flooring deposit: $1,000 (refundable upon satisfactory completion)

Contact management for renovation application forms and detailed guidelines.`
  },
  {
    slug: 'gallery',
    title: 'Photo Gallery',
    content: `# Photo Gallery

Welcome to our building's photo gallery showcasing our beautiful amenities and community spaces.

## Building Amenities
- Modern fitness center with cardio and weight equipment
- Rooftop terrace with panoramic city views
- Indoor swimming pool and hot tub
- Party room available for resident bookings
- Children's playground and outdoor seating areas

## Recent Events
- Annual Summer BBQ
- Holiday celebration in the party room
- Community garden harvest
- Building improvement projects

## Submit Photos
Residents are welcome to submit photos of building events and amenities. Please email photos to: photos@ourbuilding.com

*Photo gallery content will be updated regularly with resident submissions and professional photography.*`
  },
  {
    slug: 'marketplace',
    title: 'Strata Marketplace',
    content: `# Strata Marketplace

Connect with your neighbors through our online marketplace! Buy, sell, or trade items within our building community.

## How It Works
1. Browse current listings below
2. Contact sellers directly using the provided information
3. Arrange pickup/delivery within the building
4. Complete transactions safely and securely

## Posting Guidelines
- Items must be legal and appropriate for our community
- Include clear descriptions and fair pricing
- Provide accurate contact information
- Remove listings once items are sold

## Safety Tips
- Meet in common areas when possible
- Bring a friend for valuable item exchanges
- Use cash or verified payment methods
- Trust your instincts

*The interactive marketplace feature allows residents to post and browse listings. Access the full marketplace functionality through the main navigation.*`
  }
];

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
  }

  // Seed pages
  try {
    console.log('\nSeeding pages...');
    
    for (const pageData of pages) {
      try {
        const existingPage = await prisma.page.findUnique({
          where: { slug: pageData.slug }
        });
        
        if (existingPage) {
          console.log(`Page "${pageData.slug}" already exists, updating...`);
          await prisma.page.update({
            where: { slug: pageData.slug },
            data: {
              title: pageData.title,
              content: pageData.content,
              isActive: true
            }
          });
        } else {
          console.log(`Creating page "${pageData.slug}"...`);
          await prisma.page.create({
            data: pageData
          });
        }
      } catch (error) {
        console.error(`Error processing page "${pageData.slug}":`, error);
      }
    }
    
    console.log('Page seeding completed!');
    
    // Display final count
    const totalPages = await prisma.page.count({ where: { isActive: true } });
    console.log(`Total active pages in database: ${totalPages}`);
    
  } catch (error) {
    console.error('Error seeding pages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();