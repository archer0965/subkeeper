# 訂閱管家（拓新雲端 NovaOS 統一登入）

獨立站固定網址：https://temporary-speedy-reef-cy4xhhu.vercel.app

- Auth：與 paycheck.com.de 相同的 Supabase Auth（NovaOS 帳號）
- 資料：`personal_subscriptions` 綁定 `user_id` + RLS
- 本機遷移：偵測 `subkeeper-subscriptions-v1` 一鍵同步後清除

## 環境變數

見 `.env.example`。需與 NovaOS Hub 使用同一 Supabase 專案。

## Migration（在 NovaOS Supabase 執行）

1. `supabase/migrations/028_personal_subscriptions.sql`
2. `supabase/migrations/029_subkeeper_auth_profile.sql`（`last_login_at`、`legacy_client_id`）

套用前請先在 staging 驗證；未套用時 API 會回傳明確錯誤訊息。
