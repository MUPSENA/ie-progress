# Auri+

施工会社・現場担当者・施主をつなぐ、住宅向け工程／進捗管理Webアプリです。Next.js、Prisma、SQLiteで構成されています。

全利用者が同じログイン画面を利用し、ログイン後に `Role` と参加中の `Project` を組み合わせて、表示画面と操作権限を制御します。UI上では既存の `WORKER` を `STAFF`、`OWNER` を `CLIENT` と表現します。

## 主な機能

- JWTのHttpOnly Cookie認証と、`ADMIN` / `WORKER` / `OWNER` の役割別権限制御
- Auri+ブランドの公開トップページ、招待アカウント登録、全役割共通のログイン導線
- Role別URL（`/admin`、`/staff`、`/client`）とサーバー側のアクセス制御
- 現場メンバー／施主単位の閲覧制限と、認可API経由の非公開写真配信
- 月・週・日の三階層工程と、日工程から親工程への進捗／遅延の自動集計
- 元予定を保持した予定変更履歴、操作監査ログ、論理削除用カラム
- スマートフォンのカメラ入力、送信前画像圧縮、通信復旧時の端末下書き再送
- 写真報告の承認、理由付き差し戻し、一括承認、承認済み報告だけの施主公開
- 施主質問と現場依頼を分離しつつ、共通タスク基盤・返信履歴・期限・未読で管理
- モバイル優先のレスポンシブUI、空／失敗／処理中／成功状態、キーボードフォーカス

## セットアップ

```bash
cp .env.example .env
# .env の AUTH_SECRET を32文字以上のランダム値へ変更
npm install
npm run db:setup
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

新規登録されたアカウントには最小権限の `OWNER` が設定され、現場は割り当てられません。管理者が運用に応じたRoleとProjectを設定するまで、他の現場データは表示されません。

## デモアカウント

すべてのパスワードは `demo1234` です。

| 役割 | メールアドレス |
|---|---|
| 管理元請け | `admin@example.jp` |
| 現場担当（大工） | `worker@example.jp` |
| 現場担当（電気） | `electric@example.jp` |
| 施主 | `owner@example.jp` |
| 別現場の施主（権限確認用） | `owner2@example.jp` |

## 検証

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

## データと運用上の注意

- 開発DBは `prisma/dev.db`、画像は `data/uploads/` に保存され、どちらもGit対象外です。
- `npm run db:setup` はテーブルを作成してからデモデータを再投入します。デモデータ投入は既存レコードを消去するため、本番では実行しないでください。
- 本番ではSQLite／ローカル画像ストレージを、PostgreSQLとS3互換の非公開オブジェクトストレージへ置き換え、署名URLまたは現在の認可API経由で配信してください。
- 本番の `AUTH_SECRET` は秘密管理基盤から供給し、TLS、CSRF対策、レート制限、バックアップ、ウイルススキャン、画像EXIF除去を追加してください。
- `prisma/schema.sql` はこの環境向けの初期化フォールバックです。継続開発では `prisma/schema.prisma` を正とし、レビュー済みのマイグレーションを運用してください。
