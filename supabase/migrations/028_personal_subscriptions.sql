-- 訂閱管家（個人訂閱開銷）：資料綁定 NovaOS Auth 帳號，需登入使用。
-- Apply on production Supabase after review.

CREATE TABLE IF NOT EXISTS public.personal_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_twd integer NOT NULL CHECK (amount_twd >= 0),
  billing_cycle text NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'custom')),
  next_billing_on date,
  reminder_days integer NOT NULL DEFAULT 3 CHECK (reminder_days >= 0 AND reminder_days <= 30),
  category text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_subscriptions_user_id_idx
  ON public.personal_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS personal_subscriptions_next_billing_idx
  ON public.personal_subscriptions (user_id, next_billing_on)
  WHERE is_active = true;

ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personal_subscriptions_select_own ON public.personal_subscriptions;
CREATE POLICY personal_subscriptions_select_own
  ON public.personal_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS personal_subscriptions_insert_own ON public.personal_subscriptions;
CREATE POLICY personal_subscriptions_insert_own
  ON public.personal_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS personal_subscriptions_update_own ON public.personal_subscriptions;
CREATE POLICY personal_subscriptions_update_own
  ON public.personal_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS personal_subscriptions_delete_own ON public.personal_subscriptions;
CREATE POLICY personal_subscriptions_delete_own
  ON public.personal_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.personal_subscriptions IS
  '訂閱管家：個人訂閱費用紀錄，僅本人可讀寫；與 NovaOS 統一登入帳號綁定';
