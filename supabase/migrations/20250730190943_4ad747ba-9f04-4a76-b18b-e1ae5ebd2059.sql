-- Add foreign key constraint from setlists to cached_shows via show_id
ALTER TABLE setlists 
ADD CONSTRAINT fk_setlists_show_id 
FOREIGN KEY (show_id) REFERENCES cached_shows(id) ON DELETE CASCADE;