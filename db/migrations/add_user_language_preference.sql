-- Add preferred_language column to the user table
ALTER TABLE user ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- Update existing users to have default language as 'en'
UPDATE user SET preferred_language = 'en' WHERE preferred_language IS NULL;