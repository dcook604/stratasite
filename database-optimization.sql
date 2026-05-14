-- Database Performance Optimization for Spectrum 4
-- Add these indexes to improve query performance

-- Marketplace Posts - frequently queried by date and status
CREATE INDEX IF NOT EXISTS idx_marketplace_posts_created_at ON marketplace_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_posts_is_sold ON marketplace_posts(is_sold);
CREATE INDEX IF NOT EXISTS idx_marketplace_posts_category ON marketplace_posts(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_posts_active_recent ON marketplace_posts(is_active, created_at DESC);

-- Marketplace Replies - queried by post
CREATE INDEX IF NOT EXISTS idx_marketplace_replies_post_id ON marketplace_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_replies_created_at ON marketplace_replies(created_at);

-- Scooter Registrations - admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_scooter_registrations_status ON scooter_registrations(status);
CREATE INDEX IF NOT EXISTS idx_scooter_registrations_created_at ON scooter_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scooter_registrations_unit_number ON scooter_registrations(unit_number);
CREATE INDEX IF NOT EXISTS idx_scooter_registrations_active ON scooter_registrations(is_active);

-- Pet Registrations - admin queries
CREATE INDEX IF NOT EXISTS idx_pet_registrations_status ON pet_registrations(status);
CREATE INDEX IF NOT EXISTS idx_pet_registrations_created_at ON pet_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pet_registrations_suite_number ON pet_registrations(suite_number);

-- Events - calendar queries
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_active_future ON events(is_active, start_date) WHERE start_date >= date('now');
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(start_date, end_date);

-- Announcements - homepage queries
CREATE INDEX IF NOT EXISTS idx_announcements_active_recent ON announcements(is_active, created_at DESC);

-- Pages - slug lookups
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug) WHERE is_active = true;

-- Documents - file queries
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

-- Emergency Contacts - unit lookups
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_unit ON emergency_contacts(unit_number);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON emergency_contacts(is_active);

-- AC Inquiries - admin management
CREATE INDEX IF NOT EXISTS idx_ac_inquiries_created_at ON ac_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ac_inquiries_active ON ac_inquiries(is_active);

-- Event Requests - admin processing
CREATE INDEX IF NOT EXISTS idx_event_requests_status ON event_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_requests_created_at ON event_requests(created_at DESC);

-- Admin Users - authentication
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Form Configuration - dynamic email system
CREATE INDEX IF NOT EXISTS idx_form_config_name ON form_configurations(form_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_form_recipients_config ON form_email_recipients(form_config_id) WHERE is_active = true;

-- Compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_marketplace_active_sold_date ON marketplace_posts(is_active, is_sold, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scooter_active_status_date ON scooter_registrations(is_active, status, created_at DESC);

-- Cleanup old data (run periodically)
-- DELETE FROM marketplace_posts WHERE created_at < date('now', '-2 years') AND is_sold = true;
-- DELETE FROM marketplace_replies WHERE created_at < date('now', '-2 years');

-- Analyze tables for query optimization
ANALYZE marketplace_posts;
ANALYZE marketplace_replies;
ANALYZE scooter_registrations;
ANALYZE pet_registrations;
ANALYZE events;
ANALYZE announcements;
ANALYZE pages;
