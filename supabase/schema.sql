-- Adapta Çekirdek Şeması
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    contact_email TEXT, -- Central inbox for notifications
    is_active BOOLEAN DEFAULT TRUE, -- Maintenance mode toggle
    theme_config JSONB DEFAULT '{}'::jsonb,

    subscription_status TEXT DEFAULT 'active',
    subscription_valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    profile_type TEXT NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE, -- Platform owner flag
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    primary_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    related_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,
    UNIQUE (primary_profile_id, related_profile_id, relation_type)
);

-- RLS Helper Functions (SECURITY DEFINER to bypass RLS internally)
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_superuser() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT is_super_admin FROM profiles WHERE id = auth.uid() LIMIT 1) = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT profile_type FROM profiles WHERE id = auth.uid() LIMIT 1) = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;




-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tenants
CREATE POLICY "Users can view their own tenant"
    ON tenants FOR SELECT
    USING (id = get_current_tenant_id() OR is_superuser());

CREATE POLICY "Authenticated users can create a tenant"
    ON tenants FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Tenants can be updated by their admins"
    ON tenants FOR UPDATE
    USING ( (id = get_current_tenant_id() AND is_admin()) OR is_superuser() );

-- Profiles
CREATE POLICY "Profiles are viewable by tenant members"
    ON profiles FOR SELECT
    USING (
        auth.uid() = id 
        OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        OR is_superuser()
    );




CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Relationships
CREATE POLICY "Relationships are viewable by tenant members"
    ON relationships FOR SELECT
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can manage relationships"
    ON relationships FOR ALL
    USING (
        tenant_id = get_current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.profile_type = 'admin'
        )
    );


-- Schedules
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, day_of_week)
);

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    credit_cost INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Schedule Policies
CREATE POLICY "Schedules are viewable by tenant members"
    ON schedules FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR is_superuser());

CREATE POLICY "Admins can manage schedules"
    ON schedules FOR ALL
    USING ( (tenant_id = get_current_tenant_id() AND is_admin()) OR is_superuser() );

-- Service Policies
CREATE POLICY "Services are viewable by anyone" 
    ON services FOR SELECT
    USING (true); 

CREATE POLICY "Admins can manage services"
    ON services FOR ALL
    USING ( (tenant_id = get_current_tenant_id() AND is_admin()) OR is_superuser() );



-- Wallets
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (tenant_id, profile_id)
);

-- Auto-create wallet on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (tenant_id, profile_id, balance)
  VALUES (NEW.tenant_id, NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile_wallet();


-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Wallet Policies
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (profile_id = auth.uid() OR is_superuser());

CREATE POLICY "Admins can manage all wallets"
    ON wallets FOR ALL
    USING ( (tenant_id = get_current_tenant_id() AND is_admin()) OR is_superuser() );

-- Appointment Policies
CREATE POLICY "Users can view their own appointments"
    ON appointments FOR SELECT
    USING (profile_id = auth.uid() OR is_superuser());

CREATE POLICY "Admins can view tenant appointments"
    ON appointments FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR is_superuser());

CREATE POLICY "Admins can manage appointments"
    ON appointments FOR DELETE
    USING ( (tenant_id = get_current_tenant_id() AND is_admin()) OR is_superuser() );



-- Atomic Booking RPC
CREATE OR REPLACE FUNCTION book_appointment_with_credit(
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_credit_cost INTEGER;
    v_wallet_balance INTEGER;
    v_appointment_id UUID;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Get user and tenant context
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Profil bulunamadı veya oturum kapalı.';
    END IF;

    -- 2. Validate 30-day window
    IF p_start_time < v_now OR p_start_time > (v_now + INTERVAL '30 days') THEN
        RAISE EXCEPTION 'Randevular sadece gelecek 30 gün için alınabilir.';
    END IF;

    -- 3. Get service cost
    SELECT credit_cost INTO v_credit_cost FROM services WHERE id = p_service_id AND tenant_id = v_tenant_id;
    IF v_credit_cost IS NULL THEN
        RAISE EXCEPTION 'Hizmet bulunamadı.';
    END IF;

    -- 4. Lock wallet row and check balance
    SELECT balance INTO v_wallet_balance FROM wallets 
    WHERE profile_id = auth.uid() AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF v_wallet_balance IS NULL THEN
        RAISE EXCEPTION 'Cüzdan bulunamadı.';
    END IF;

    IF v_wallet_balance < v_credit_cost THEN
        RAISE EXCEPTION 'Yetersiz kredi bakiyesi.';
    END IF;

    -- 5. Check for availability (Slot Free?)
    IF EXISTS (
        SELECT 1 FROM appointments 
        WHERE tenant_id = v_tenant_id 
        AND status = 'confirmed'
        AND (
            (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Bu zaman dilimi zaten dolu.';
    END IF;

    -- 6. Perform Atomic Transaction
    UPDATE wallets SET balance = balance - v_credit_cost 
    WHERE profile_id = auth.uid() AND tenant_id = v_tenant_id;

    INSERT INTO appointments (tenant_id, service_id, profile_id, start_time, end_time, status)
    VALUES (v_tenant_id, p_service_id, auth.uid(), p_start_time, p_end_time, 'confirmed')
    RETURNING id INTO v_appointment_id;

    RETURN jsonb_build_object(
        'success', true, 
        'appointment_id', v_appointment_id,
        'new_balance', v_wallet_balance - v_credit_cost
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin function to increment wallet balance
CREATE OR REPLACE FUNCTION increment_wallet_balance(
    p_profile_id UUID,
    p_tenant_id UUID,
    p_amount INTEGER
) RETURNS VOID AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    UPDATE wallets 
    SET balance = balance + p_amount 
    WHERE profile_id = p_profile_id AND tenant_id = p_tenant_id
    RETURNING balance INTO v_new_balance;

    INSERT INTO credit_transactions (tenant_id, profile_id, amount, type, description, balance_after)
    VALUES (p_tenant_id, p_profile_id, p_amount, 'topup', 'Admin tarafından manuel yükleme', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Credit Transactions Log
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('topup', 'booking', 'refund', 'adjustment')),
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own transactions"
    ON credit_transactions FOR SELECT
    USING (profile_id = auth.uid() OR is_superuser());

CREATE POLICY "Admins can see all tenant transactions"
    ON credit_transactions FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR is_superuser());



-- UPDATED: Atomic Booking RPC with Logging
CREATE OR REPLACE FUNCTION book_appointment_with_credit(
    p_service_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
    v_credit_cost INTEGER;
    v_wallet_balance INTEGER;
    v_appointment_id UUID;
    v_service_name TEXT;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = auth.uid();
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Profil bulunamadı.'; END IF;

    IF p_start_time < v_now OR p_start_time > (v_now + INTERVAL '30 days') THEN
        RAISE EXCEPTION 'Randevular sadece gelecek 30 gün için alınabilir.';
    END IF;

    SELECT credit_cost, name INTO v_credit_cost, v_service_name FROM services WHERE id = p_service_id AND tenant_id = v_tenant_id;
    
    SELECT balance INTO v_wallet_balance FROM wallets 
    WHERE profile_id = auth.uid() AND tenant_id = v_tenant_id
    FOR UPDATE;

    IF v_wallet_balance < v_credit_cost THEN RAISE EXCEPTION 'Yetersiz kredi.'; END IF;

    IF EXISTS (
        SELECT 1 FROM appointments WHERE tenant_id = v_tenant_id AND status = 'confirmed'
        AND ((start_time, end_time) OVERLAPS (p_start_time, p_end_time))
    ) THEN RAISE EXCEPTION 'Slot dolu.'; END IF;

    UPDATE wallets SET balance = balance - v_credit_cost WHERE profile_id = auth.uid() AND tenant_id = v_tenant_id;

    INSERT INTO appointments (tenant_id, service_id, profile_id, start_time, end_time, status)
    VALUES (v_tenant_id, p_service_id, auth.uid(), p_start_time, p_end_time, 'confirmed')
    RETURNING id INTO v_appointment_id;

    INSERT INTO credit_transactions (tenant_id, profile_id, amount, type, description, balance_after)
    VALUES (v_tenant_id, auth.uid(), -v_credit_cost, 'booking', v_service_name || ' randevusu', v_wallet_balance - v_credit_cost);

    RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- NEW: Atomic Cancellation & Refund
CREATE OR REPLACE FUNCTION cancel_appointment_with_refund(
    p_appointment_id UUID
) RETURNS VOID AS $$
DECLARE
    v_tenant_id UUID;
    v_profile_id UUID;
    v_credit_cost INTEGER;
    v_wallet_balance INTEGER;
    v_status TEXT;
BEGIN
    -- 1. Get current tenant context
    v_tenant_id := get_current_tenant_id();
    
    -- 2. Validate appointment and get details
    SELECT a.profile_id, a.status, s.credit_cost 
    INTO v_profile_id, v_status, v_credit_cost
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.id = p_appointment_id AND a.tenant_id = v_tenant_id;

    IF v_status != 'confirmed' THEN
        RAISE EXCEPTION 'Sadece onaylanmış randevular iptal edilebilir.';
    END IF;

    -- 3. Mark as cancelled
    UPDATE appointments SET status = 'cancelled' WHERE id = p_appointment_id;

    -- 4. Lock wallet and refund
    SELECT balance INTO v_wallet_balance FROM wallets 
    WHERE profile_id = v_profile_id AND tenant_id = v_tenant_id
    FOR UPDATE;

    UPDATE wallets SET balance = balance + v_credit_cost 
    WHERE profile_id = v_profile_id AND tenant_id = v_tenant_id;

    -- 5. Log transaction
    INSERT INTO credit_transactions (tenant_id, profile_id, amount, type, description, balance_after)
    VALUES (v_tenant_id, v_profile_id, v_credit_cost, 'refund', 'Randevu iptal iadesi', v_wallet_balance + v_credit_cost);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATOMIC ONBOARDING RPC
CREATE OR REPLACE FUNCTION onboard_tenant(
  p_name TEXT,
  p_slug TEXT,
  p_contact_email TEXT,
  p_theme_config JSONB,
  p_first_name TEXT,
  p_last_name TEXT
) RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_profile_id UUID := auth.uid();
BEGIN
  -- 1. Insert Tenant
  INSERT INTO tenants (name, slug, contact_email, theme_config)
  VALUES (p_name, p_slug, p_contact_email, p_theme_config)
  RETURNING id INTO v_tenant_id;

  -- 2. Insert Profile (as admin)
  INSERT INTO profiles (id, tenant_id, first_name, last_name, email, profile_type)
  VALUES (v_profile_id, v_tenant_id, p_first_name, p_last_name, (SELECT email FROM auth.users WHERE id = v_profile_id), 'admin');

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



