-- 訂閱管家：登入時間 + 本機遷移對應鍵
-- Apply after 028_personal_subscriptions.sql on production.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

COMMENT ON COLUMN public.profiles.last_login_at IS
  '最近一次於 NovaOS 產品（含訂閱管家）完成登入／session touch 的時間（UTC）';

ALTER TABLE public.personal_subscriptions
  ADD COLUMN IF NOT EXISTS legacy_client_id text;

COMMENT ON COLUMN public.personal_subscriptions.legacy_client_id IS
  '舊版 SubKeeper localStorage 項目 id；用於一鍵同步去重';

-- NULL legacy ids do not collide (PostgreSQL UNIQUE treats NULL as distinct).
CREATE UNIQUE INDEX IF NOT EXISTS personal_subscriptions_user_legacy_uidx
  ON public.personal_subscriptions (user_id, legacy_client_id);
