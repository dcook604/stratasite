import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pages = [
  {
    slug: 'bylaws',
    title: 'Building Bylaws',
    content: `# Building Bylaws

Access and search all strata bylaws, rules, and regulations.

## General Bylaws & Rules
Complete strata bylaws and rules document covering all aspects of building operations.

## Pet Policy
Guidelines for pet owners in the building including registration requirements and restrictions.

## Noise Restrictions
Hours and guidelines for noise limitations to ensure peaceful living for all residents.

## Common Area Usage
Rules for using shared spaces in the building including booking procedures and restrictions.

## Parking Regulations
Visitor and resident parking policies including enforcement and fines.

## Bylaw Enforcement
Process for bylaw violation complaints and fines including appeals procedures.

For specific bylaw documents and detailed regulations, please contact the strata manager.`
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
    slug: 'recycling',
    title: 'Recycling & Waste',
    content: `# Recycling & Waste Management

Guidelines for proper waste disposal and recycling in our building.

## Recycling Guidelines
Please follow these guidelines to ensure proper recycling:

- **Paper & Cardboard**: Clean and dry materials only
- **Plastic**: Check recycling numbers (1, 2, 5 accepted)
- **Glass**: All colors accepted, rinse containers
- **Metal**: Aluminum cans and steel containers

## Garbage Disposal
- All garbage must be properly bagged
- No loose items in garbage chutes
- Large items require special pickup arrangements

## Collection Schedule
- **Garbage**: Daily pickup
- **Recycling**: Tuesdays and Fridays
- **Organic Waste**: See organics page for details

## Common Recycling Mistakes
- Pizza boxes with grease (goes in garbage)
- Plastic bags (take to grocery store collection)
- Electronics (special disposal required)

For questions about waste disposal, contact the building manager.`
  },
  {
    slug: 'organics',
    title: 'Organics Program',
    content: `# Organics Waste Program

Information about our building's organics waste collection program.

## What Goes in Organics
- Food scraps and leftovers
- Fruit and vegetable peels
- Coffee grounds and tea bags
- Eggshells and nutshells
- Small amounts of soiled paper

## What Doesn't Go in Organics
- Meat and dairy products
- Cooking oils and fats
- Pet waste
- Diapers
- Large amounts of liquid

## Collection Details
- Green bins are collected twice weekly
- Use provided compostable bags or newspaper
- Keep bins clean and closed

## Benefits
- Reduces building waste costs
- Creates valuable compost
- Better for the environment

Please help make our organics program successful by following these guidelines.`
  },
  {
    slug: 'renovations',
    title: 'Renovations & Alterations',
    content: `# Renovations & Alterations

Guidelines and requirements for unit renovations and alterations.

## Before You Start
All renovations require prior approval from the strata corporation. This includes:
- Flooring changes
- Kitchen and bathroom renovations
- Electrical and plumbing work
- Structural modifications

## Application Process
1. Submit Form J (available from strata manager)
2. Include detailed plans and contractor information
3. Provide proof of insurance
4. Pay required deposit
5. Wait for written approval before starting

## Work Hours
- **Weekdays**: 8:00 AM to 6:00 PM
- **Saturdays**: 9:00 AM to 5:00 PM
- **Sundays & Holidays**: No construction work

## Requirements
- All contractors must be licensed and insured
- Work must comply with building codes
- No structural changes without engineer approval
- Noise bylaws must be followed

## Deposits & Fees
- **Renovation Deposit**: $1,000 (refundable)
- **Processing Fee**: $150 (non-refundable)
- **Move-in/out Coordination**: $200

**Important**: Unauthorized renovations may result in fines and orders to restore the unit to its original condition.`
  },
  {
    slug: 'contact',
    title: 'Contact Information',
    content: `# Contact Information

Get in touch with building management and important contacts.

## Strata Manager
**ABC Property Management**
- **Phone**: (604) 555-0123
- **Email**: manager@abcproperty.com
- **Office Hours**: Monday-Friday, 9:00 AM - 5:00 PM

## Emergency Contacts
- **Building Emergency**: (604) 555-0199
- **Fire Department**: 911
- **Police**: 911
- **Poison Control**: 1-800-567-8911

## Council Members
- **President**: John Smith (Unit 1205)
- **Vice President**: Sarah Johnson (Unit 0804)
- **Treasurer**: Mike Chen (Unit 1508)
- **Secretary**: Lisa Wong (Unit 0603)

## Service Providers
### Maintenance & Repairs
- **Plumbing**: City Plumbers (604) 555-0156
- **Electrical**: Bright Electric (604) 555-0178
- **HVAC**: Cool Air Systems (604) 555-0134

### Building Services
- **Security**: Guardian Security (604) 555-0145
- **Cleaning**: Premier Cleaning (604) 555-0167
- **Landscaping**: Green Thumb Gardens (604) 555-0189

## Office Location
**Building Management Office**
Located on the ground floor, beside the mailboxes.

**Mailing Address:**
123 Main Street, Suite 100
Vancouver, BC V6B 1A1`
  },
  {
    slug: 'gallery',
    title: 'Photo Gallery',
    content: `# Photo Gallery

Explore photos of our building amenities and common areas.

## Building Amenities
View photos of our fantastic building amenities including:

- **Fitness Center**: State-of-the-art equipment and yoga studio
- **Rooftop Deck**: Outdoor seating with city views
- **Party Room**: Perfect for celebrations and gatherings
- **Business Center**: Quiet workspace with printing facilities

## Common Areas
- **Main Lobby**: Elegant entrance with concierge desk
- **Courtyard Garden**: Peaceful outdoor space
- **Recreation Room**: Games and entertainment area
- **Library Corner**: Quiet reading space

## Building Exterior
- **Front Entrance**: Modern architectural design
- **Parking Garage**: Secure underground parking
- **Bike Storage**: Dedicated cycling storage area

*Photo gallery functionality will be enhanced with actual image uploads in future updates.*

To submit photos for inclusion in the gallery, please contact the building manager.`
  },
  {
    slug: 'marketplace',
    title: 'Strata Marketplace',
    content: `# Strata Marketplace

Buy, sell, and trade items with your neighbors in our community marketplace.

## How It Works
The Strata Marketplace is a community platform where residents can:
- **Sell items** you no longer need
- **Find items** you're looking for from neighbors
- **Trade items** with other residents
- **Connect** with your community

## Getting Started
1. Browse existing posts to see what's available
2. Use the filter to find specific types of posts
3. Click "Create New Post" to list your own items
4. Reply to posts that interest you
5. Connect directly with other residents

## Categories
- Electronics
- Furniture
- Appliances
- Books & Media
- Clothing
- Sports & Recreation
- Tools & Hardware
- Home Decor
- Other

## Community Guidelines
- Be respectful and honest in all interactions
- Provide accurate descriptions of items
- Meet in common areas for safety
- Honor your commitments
- Report any issues to building management

## Safety Tips
- Meet in well-lit common areas
- Bring a friend if possible
- Trust your instincts
- Don't share personal information unnecessarily

Happy trading with your neighbors!`
  }
];

async function seedPages() {
  console.log('Seeding pages...');
  
  for (const page of pages) {
    try {
      await prisma.page.upsert({
        where: { slug: page.slug },
        update: {
          title: page.title,
          content: page.content
        },
        create: {
          slug: page.slug,
          title: page.title,
          content: page.content
        }
      });
      console.log(`✓ Seeded page: ${page.title}`);
    } catch (error) {
      console.error(`Error seeding page ${page.title}:`, error);
    }
  }
  
  console.log('Page seeding completed!');
}

seedPages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });