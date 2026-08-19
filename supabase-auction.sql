-- Auction House tables

CREATE TABLE IF NOT EXISTS auction_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller text NOT NULL,
  inventory_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL,
  starting_price int NOT NULL DEFAULT 100,
  buy_now_price int,
  current_bid int DEFAULT 0,
  current_bidder text,
  bid_count int DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES auction_listings(id),
  bidder text NOT NULL,
  amount int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE auction_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

-- Public read on listings
CREATE POLICY "Anyone can view listings" ON auction_listings
  FOR SELECT USING (true);

-- Authenticated insert on listings
CREATE POLICY "Authenticated users can create listings" ON auction_listings
  FOR INSERT WITH CHECK (true);

-- Authenticated update on listings (seller or system)
CREATE POLICY "Users can update listings" ON auction_listings
  FOR UPDATE USING (true);

-- Public read on bids
CREATE POLICY "Anyone can view bids" ON auction_bids
  FOR SELECT USING (true);

-- Authenticated insert on bids
CREATE POLICY "Authenticated users can place bids" ON auction_bids
  FOR INSERT WITH CHECK (true);
