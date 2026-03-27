# システム構成

## 技術スタック

- **バックエンド**: Google Apps Script（スプレッドシートバウンド）
- **フロントエンド**: HTML/CSS/JavaScript（バニラ）
- **ホスティング**: GitHub Pages（iframe経由）+ GAS Webアプリ
- **ソース管理**: clasp + GitHub（Private: LuggageWebApp）

## URL構成

| URL | 内容 |
|---|---|
| `kz8.github.io/eibi-form/` | フォーム（iframe） |
| `kz8.github.io/eibi-form/?mode=opview` | 参加状況ビューア |
| `kz8.github.io/eibi-form/?mode=receiving` | 入庫記録 |
| `kz8.github.io/eibi-form/?mode=guidance` | 集荷メール送信 |
| `kz8.github.io/eibi-form/portal.html` | ポータル（パスワード保護） |
| `kz8.github.io/eibi-form/wiki/` | Wiki（本ページ） |

## GAS実行アカウント

| 操作 | 実行アカウント |
|---|---|
| Webアプリ（フォーム等） | デプロイ設定アカウント（eibi.soudankai@gmail.com） |
| CL変更検知トリガー | トリガー設定者（eibi.soudankai@gmail.com） |
| 集荷メール送信（SSダイアログ） | SSを開いているユーザー |

## 定期トリガー

| 関数 | スケジュール | 内容 |
|---|---|---|
| runCLChangeNotification | 毎日8時・17時 | 営業SS差異＋フォーム変更依頼の通知メール |

## clasp運用

- 複数環境で編集する場合は、作業前に `clasp pull` で最新を取得する
- `clasp push` は最後に実行した内容でリモートを上書きする（マージなし）
