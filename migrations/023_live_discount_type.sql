ALTER TABLE lives
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'cart',
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

ALTER TABLE lives
  ADD CONSTRAINT lives_discount_type_check
  CHECK (discount_type IN ('cart', 'coupon'));
