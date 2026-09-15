-- FAQ table for customer-facing frequently asked questions
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active faqs" ON faqs FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage faqs" ON faqs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- Trigger for updated_at
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed data
INSERT INTO faqs (question, answer, category, sort_order, status) VALUES
  ('What is your return policy?', 'We offer a 30-day return policy for all items in original condition with tags attached. Refunds are processed within 5-7 business days after we receive the returned item.', 'Returns & Exchanges', 1, 'active'),
  ('How long does shipping take?', 'Standard shipping takes 3-7 business days. Express shipping takes 1-2 business days. International shipping takes 7-21 business days depending on destination.', 'Shipping', 2, 'active'),
  ('Do you ship internationally?', 'Yes, we ship to over 100 countries worldwide. Shipping costs and delivery times vary by destination. Customs duties and taxes may apply.', 'Shipping', 3, 'active'),
  ('How can I track my order?', 'Once your order ships, you will receive an email with a tracking number. You can also track your order in your account under "My Orders".', 'Orders', 4, 'active'),
  ('What payment methods do you accept?', 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Klarna for buy now, pay later.', 'Payments', 5, 'active'),
  ('Can I cancel or modify my order?', 'Orders can be cancelled or modified within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact support for assistance.', 'Orders', 6, 'active'),
  ('How do I initiate a return?', 'Log into your account, go to "My Orders", select the order, and click "Return Items". Follow the prompts to generate a return label.', 'Returns & Exchanges', 7, 'active'),
  ('What is your warranty policy?', 'All products come with a 1-year manufacturer warranty against defects. Extended warranties are available for purchase at checkout.', 'Products', 8, 'active'),
  ('How do I contact customer support?', 'You can reach us via email at support@example.com, through the contact form on our website, or by phone at 1-800-XXX-XXXX during business hours.', 'Support', 9, 'active'),
  ('Do you offer gift cards?', 'Yes, digital gift cards are available in amounts from $10 to $500. They never expire and can be used on any purchase.', 'General', 10, 'active'),
  ('How do I create an account?', 'Click "Sign Up" in the top navigation. You can register with your email or use Google/Apple sign-in for faster checkout.', 'Account', 11, 'active'),
  ('Can I change my shipping address after ordering?', 'Address changes are only possible within 1 hour of order placement. After that, the order is locked for fulfillment. Contact support for urgent changes.', 'Orders', 12, 'active'),
ON CONFLICT DO NOTHING;