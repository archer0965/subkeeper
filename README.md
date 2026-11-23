# 訂閱管家（拓新雲端 NovaOS 統一登入）

獨立站固定網址：https://temporary-speedy-reef-cy4xhhu.vercel.app

- Auth：與 paycheck.com.de 相同的 Supabase Auth（NovaOS 帳號）；登入後經 `/auth/receive` 回本站
- 資料：`personal_subscriptions` 綁定 `user_id` + RLS；API 皆依 `user.id` 隔離
- 落地頁：產品介紹 + 假資料互動 Demo（不含個資）
- 匯出／清除：App 內 Export JSON／CSV；隱私面板可清除本產品雲端訂閱（`DELETE /api/account/data`）
- 本機遷移：偵測舊版本機快取一鍵同步後清除

## 環境變數

見 `.env.example`。需與 NovaOS Hub 使用同一 Supabase 專案。

## Migration（在 NovaOS Supabase 執行）

1. `supabase/migrations/028_personal_subscriptions.sql`
2. `supabase/migrations/029_subkeeper_auth_profile.sql`（`last_login_at`、`legacy_client_id`）

套用前請先在 staging 驗證；未套用時 API 會回傳明確錯誤訊息。

## 測試

```bash
npm test
```
