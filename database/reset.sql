-- Drops every PathFinder table and type. DELETES ALL DATA. Development only.
--     psql -U postgres -d pathfinder_db -f database/reset.sql
--     psql -U postgres -d pathfinder_db -f database/schema.sql
DROP TABLE IF EXISTS audit_log, payments, payment_accounts, bookings, mentor_slots, mentors, journeys, users CASCADE;
DROP TYPE IF EXISTS payment_status, booking_status, mentor_status, admin_role, user_role;
