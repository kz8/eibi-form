# システム構成

## 技術スタック

- **バックエンド**: Google Apps Script（スプレッドシートバウンド）
- **フロントエンド**: HTML/CSS/JavaScript（バニラ）
- **ホスティング**: GitHub Pages（iframe経由）+ GAS Webアプリ
- **ソース管理**: clasp + GitHub（Private: kz8/LuggageWebApp）
- **ドキュメント**: Docsify（GitHub Pages: kz8/eibi-form）

## URL構成

| URL | 内容 |
|---|---|
| `kz8.github.io/eibi-form/?code=XXX` | 荷物登録フォーム（個校） |
| `kz8.github.io/eibi-form/?corp=XXX` | 荷物登録フォーム（法人） |
| `kz8.github.io/eibi-form/?mode=opview` | 参加状況ビューア |
| `kz8.github.io/eibi-form/?mode=receiving` | 入庫記録 |
| `kz8.github.io/eibi-form/?mode=guidance` | 集荷案内メール送信 |
| `kz8.github.io/eibi-form/portal.html` | ポータル（パスワード保護） |
| `kz8.github.io/eibi-form/wiki/` | Wiki（本ページ） |

## iframe構成

顧客・運営ともにGitHub Pages経由でアクセスする。GitHub PagesのHTMLがGAS WebアプリURLをiframeで埋め込む。

```
ユーザー → kz8.github.io/eibi-form/
         → iframe内: script.google.com/.../exec
```

**採用理由**:
- Googleログイン時の `/u/N/` URL書き換え問題を回避
- GASの「このアプリケーションはGoogle Apps Scriptを使用して...」バナーが非表示
- ファビコンの設定が可能

## GAS実行アカウント

| 操作 | 実行アカウント |
|---|---|
| Webアプリ（フォーム・ビューア・メール送信） | デプロイ設定アカウント（eibi.soudankai@gmail.com） |
| CL変更検知トリガー | トリガー設定者（eibi.soudankai@gmail.com） |
| 集荷メール送信（SSダイアログ） | SSを開いているユーザー |

> **重要**: デプロイは必ず `eibi.soudankai@gmail.com` で行うこと

## メール送信エイリアス

- 送信元表示: `soudankai-s@eibi.co.jp`
- 実際の送信: `eibi.soudankai@gmail.com`（GAS実行アカウント）
- 転送設定: `soudankai-s@eibi.co.jp` → `eibi.soudankai@gmail.com`

## 定期トリガー

| 関数 | スケジュール | 内容 |
|---|---|---|
| runCLChangeNotification | 毎日8時・17時 | 営業SS差異＋フォーム変更依頼の通知メール |

## clasp運用

- 複数環境で編集する場合は、**作業前に `clasp pull`** で最新を取得する
- `clasp push` は最後に実行した内容でリモートを上書きする（マージ機能なし）
- `clasp deployments` でデプロイ一覧を確認可能

## 主要シート一覧

| シート | 用途 |
|---|---|
| 縦持ち_自動 | CSV取込データ（参加校×企画の縦持ち） |
| 学校基本情報 | 学校マスタ（ヘッダー行3、データ行4〜） |
| 企画設定 | 企画・ルート・会場の設定 |
| 物流設定 | ルートごとの送付期限 |
| 入庫管理 | 予定個口・入庫個口の管理 |
| 荷物登録_回答 | フォーム回答の蓄積 |
| 26社員マスタ | 担当営業の選択肢（A列: 社員名） |
| 法人マスタ | 法人コード・代表校コード |
| 送信ログ | 集荷メール送信履歴 |
| 変更依頼 | 顧客からの担当者情報変更依頼 |
| SS差異確認 | 営業SS差異の確認済みスナップショット |

## パフォーマンス最適化

- CacheService: 企画設定(30分)、OpViewデータ(5分)、ダッシュボード(5分)
- 書込み時にキャッシュ自動無効化
- メニュー「システム」→「キャッシュクリア」で手動リセット可能
