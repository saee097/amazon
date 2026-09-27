-- Blog posts table for content marketing
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published blogs" ON blogs FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage blogs" ON blogs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Trigger for updated_at
CREATE TRIGGER blogs_updated_at BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed data
INSERT INTO blogs (title, slug, excerpt, content, status, tags, meta_title, meta_description) VALUES
  ('10 Ways to Style Your Winter Coat', 'style-winter-coat', 'Discover the latest trends in winter outerwear and how to layer like a pro.', '## Layer Like a Pro\n\nThe key to styling a winter coat is all about layering...', 'published', ARRAY['fashion', 'winter', 'style'], '10 Ways to Style Your Winter Coat', 'Learn how to style your winter coat with these 10 expert tips.'),
  ('The Ultimate Guide to Sustainable Fashion', 'sustainable-fashion-guide', 'Everything you need to know about making eco-friendly fashion choices.', '## Sustainable Fashion 101\n\nSustainable fashion is about reducing environmental impact...', 'published', ARRAY['sustainability', 'fashion', 'eco'], 'The Ultimate Guide to Sustainable Fashion', 'Everything you need to know about sustainable fashion choices.'),
  ('How to Choose the Perfect Running Shoes', 'perfect-running-shoes', 'A comprehensive guide to finding the right running shoes for your feet and gait.', '## Finding Your Perfect Fit\n\nThe right running shoes can prevent injuries...', 'draft', ARRAY['fitness', 'shoes', 'running'], 'How to Choose the Perfect Running Shoes', 'Find the perfect running shoes with our comprehensive guide.')
ON CONFLICT (slug) DO NOTHING;
