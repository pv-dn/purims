# Purims（プリームス伝票発行システム）配布版

株式会社プリームス／ネクサス向けの伝票発行アプリ（独立運用）。

- **公開URL**: https://pv-dn.github.io/purims/
- **Firebase**: `nexus-laundry`（Realtime Database）
- **自社用**: 別リポジトリ [`pv-dn/primussystem`](https://github.com/pv-dn/primussystem)（Firebase `primus-deee2`）

## 機能概要

- 伝票発行（同一納品日ロック・訂正再発行・客先スキップ・一括印刷キュー）
- 発行履歴（月／客先／削除履歴・検索・選択一括印刷・保存期間設定）
- マスタ管理（ログインパスワード再認証）
- ユーザー管理（`purims_users`）・管理者パスワード（`purims_admin_pass` / `purims_admin_pass2`）
- 請求明細書機能は配布版では無効

## Firebase パス

- `purims/data` … 客先・品目などマスタ
- `purims/history/{id}` … 発行履歴（件単位）
- `purims/historyDeleted/{id}` … 削除履歴
- `purims/settings/historyKeepMonths` … 履歴保存期間（3/6/12/0=無期限）
- `purims_users` / `purims_admin_pass` / `purims_loginlog` / `purims_masterlog`

旧形式（`purims` 直下に `history` 配列）はログイン時に自動移行します。
