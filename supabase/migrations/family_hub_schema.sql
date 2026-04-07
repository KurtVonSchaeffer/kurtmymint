-- ============================================================
-- Family Hub Database Schema
-- Provides tables and functions for the Family Wallet feature.
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    gender TEXT CHECK (gender IN ('Boy', 'Girl', 'Baby', 'Other', 'Son', 'Daughter', 'Infant')),
    date_of_birth DATE,
    id_number TEXT,
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    avatar_url TEXT,
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their family members" 
ON public.family_members FOR ALL 
USING (auth.uid() = parent_id);

-- 2. Family Transactions Table
CREATE TABLE IF NOT EXISTS public.family_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('allowance', 'investment', 'member_joined', 'goal_funding')),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    strategy TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for family_transactions
ALTER TABLE public.family_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their family transactions" 
ON public.family_transactions FOR ALL 
USING (auth.uid() = parent_id);

-- 3. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0.00,
    emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for savings_goals
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their children's goals" 
ON public.savings_goals FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.family_members m 
        WHERE m.id = savings_goals.member_id AND m.parent_id = auth.uid()
    )
);

-- 4. RPC for Net Worth Calculation
-- Merges parent balance (from wallets) and all family member balances.
CREATE OR REPLACE FUNCTION calculate_family_net_worth(p_parent_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_parent_balance DECIMAL(15, 2);
    v_children_total DECIMAL(15, 2);
BEGIN
    -- Get parent wallet balance (assuming 'wallets' table exists)
    SELECT COALESCE(SUM(balance), 0) INTO v_parent_balance 
    FROM wallets 
    WHERE user_id = p_parent_id;

    -- Get sum of all family member balances
    SELECT COALESCE(SUM(available_balance), 0) INTO v_children_total 
    FROM family_members 
    WHERE parent_id = p_parent_id;

    RETURN jsonb_build_object(
        'parentBalance', v_parent_balance,
        'childrenTotal', v_children_total,
        'totalNetWorth', v_parent_balance + v_children_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_members_modtime
    BEFORE UPDATE ON family_members
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_savings_goals_modtime
    BEFORE UPDATE ON savings_goals
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
