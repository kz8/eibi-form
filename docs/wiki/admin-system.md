# システム構成

> このページは管理者・開発者向けの技術情報です。日常の運用操作については [運用ガイド](README.md) を参照してください。

## システムの全体像

このシステムは、Googleスプレッドシートをデータベースとして使い、Google Apps Script（GAS）でWebアプリを動かしています。
ユーザーがアクセスするURLは GitHub Pages 上にあり、内部的に GAS の画面を埋め込む（iframe）形で動作しています。

```
ユーザーのブラウザ
  → kz8.github.io/eibi-form/（GitHub Pages）
    → 内部で script.google.com/.../exec（GAS Webアプリ）を表示
```

> **なぜ直接GASのURLではないのか？**
> - Googleアカウント切り替え時のURL書き換え問題を回避するため
> - GASの警告バナー（「このアプリケーションは…」）を非表示にするため
> - ブラウザのタブにアイコン（ファビコン）を表示するため

## URL一覧

| URL | 内容 | 操作ガイド |
|---|---|---|
| `kz8.github.io/eibi-form/?code=XXX` | 荷物登録フォーム（個校） | [操作ガイド](guide-form.md) |
| `kz8.github.io/eibi-form/?corp=XXX` | 荷物登録フォーム（法人） | [操作ガイド](guide-form.md) |
| `kz8.github.io/eibi-form/?mode=opview` | 参加状況ビューア | [操作ガイド](guide-opview.md) |
| `kz8.github.io/eibi-form/?mode=receiving` | 入庫記録 | [操作ガイド](guide-receiving.md) |
| `kz8.github.io/eibi-form/?mode=guidance` | 集荷案内メール送信 | [操作ガイド](guide-mail.md) |
| `kz8.github.io/eibi-form/?mode=remind` | リマインドメール送信 | [操作ガイド](guide-mail.md) |
| `kz8.github.io/eibi-form/?mode=distribution` | 配付物管理ビューア | [操作ガイド](guide-distribution.md) |
| `kz8.github.io/eibi-form/portal.html` | ポータル（パスワード保護） | — |
| `kz8.github.io/eibi-form/guide.html` | 荷物取扱いのご案内（顧客向け） | — |
| `kz8.github.io/eibi-form/wiki/` | Wiki（本ページ） | — |

## 実行アカウント

このシステムの裏側では `eibi.soudankai@gmail.com` というGoogleアカウントが動いています。
メール送信やデータの読み書きは、このアカウントの権限で実行されます。

| 操作 | 実行されるアカウント |
|---|---|
| Webアプリ（フォーム・ビューア・メール送信） | eibi.soudankai@gmail.com |
| CL変更検知トリガー（自動通知） | eibi.soudankai@gmail.com |
| 集荷メール送信（スプレッドシートから） | スプレッドシートを開いているユーザー |

> **重要**: プログラムの更新（デプロイ）は必ず `eibi.soudankai@gmail.com` で行ってください。
> 別のアカウントでデプロイすると、すべてのWebアプリの実行アカウントが変わってしまいます。

## メールの送信元

参加校に届くメールの送信元は `soudankai-s@eibi.co.jp` と表示されますが、
実際には `eibi.soudankai@gmail.com` から送信しています（Gmailのエイリアス機能を利用）。

参加校が返信した場合は、`soudankai-s@eibi.co.jp` 宛てに届きます。
このアドレスは `eibi.soudankai@gmail.com` に転送されているため、Gmailで確認できます。

## 自動化（定期トリガー）

以下の処理が定期的に自動実行されます。**すべて土日はスキップ** されます（関数内で曜日チェック）。

### GASトリガー（時間主導型）

| 実行時刻 | 関数 | 内容 | 通知先 |
|---|---|---|---|
| 毎日 8:00 / 17:00 | `runCLChangeNotification` | 営業SSとの差異 + フォーム変更依頼の通知メール | eibi.soudankai@gmail.com |
| 毎朝 7-8時 | `autoCreateGuidanceDrafts` | 集荷案内メールの下書き自動作成（**期限30〜37日後**の対象。締切1ヶ月前発動。2026-04-24に旧14〜21日後から変更） | chikoshima@eibi.co.jp |
| 毎朝 7-8時 | `autoCreateReminderDrafts` | リマインドメールの下書き自動作成（未回答 期限3日前/超過。終了済み会場はスキップ） | chikoshima@eibi.co.jp |
| 1日2回（9時・18時） | `checkAllSentDrafts` | Gmail送信済みフォルダを件名・宛先・日時で照合し、ログを「下書き作成」→「成功」に更新 | （ログのみ） |
| 5分ごと | `warmupFormCache` | 顧客向けフォームの4キャッシュを温め（参加データ・期限マップ・プリフィル・学校基本情報） | （なし） |
| 15分ごと | `autoImportCSV` | CSV取込フォルダにCSVがあれば取込（4フェーズ化済み・タイムアウト対策あり）。**2026-04-28以降 1時間ごと→15分ごとに変更**（取込頻度を上げて取込ログ・差分検出の鮮度を高めるため） | （取込ログ） |

> 自動下書き作成は **下書きを作るだけで送信しません**。出社後にGmail下書きフォルダで内容確認 → 手動で送信。
> 下書きを削除すれば再実行で再作成されます（リマインド送信済みフラグは実送信時のみ立つため）。
> `checkAllSentDrafts` は手動送信した下書きの実送信を検知してログを更新する仕組み（送信済み判定）。
> 集荷案内・リマインド・CL変更通知すべてのトリガーで **土日はスキップ** されます。

### GitHub Actions トリガー（CSV自動取得）

eibi-csv-auto リポジトリで稼働中の Playwright スクリプト：

| 実行時刻 | 内容 |
|---|---|
| 平日 9:00〜19:00 の毎時 | 参加申込システムから大学・専門学校CSVを自動ダウンロードしGoogle Driveへアップロード |

- 月の使用時間: 約484分（GitHub Actions無料枠2000分の24%）
- シーズンオフ（1〜2月）は workflow を手動で Disable する運用
- Node.js 24対応済み（`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true`）
- `autoImportCSV` 内で `buildDiffSummary_()` を呼び出し、新規参加・撤退・ステータス変更などを取込ログに記録（参加状況ビューアの「取込履歴」タブから閲覧可能）

## スプレッドシートのシート一覧

データはすべてGoogleスプレッドシートの各シートに保存されています。

| シート名 | 何が入っているか |
|---|---|
| 縦持ち_自動 | CSV取込データ（参加校×企画の組み合わせ） |
| 学校基本情報 | 学校の基本情報（名前・コード・担当者など） |
| 企画設定 | 企画・ルート・会場の設定 |
| 物流設定 | ルートごとの送付期限 |
| 入庫管理 | 予定個口・入庫個口の管理 |
| 荷物登録_回答 | フォーム回答の蓄積 |
| 26社員マスタ | 担当営業のリスト |
| 法人マスタ | 法人コード・代表校コード |
| 配布物マスタ | 配付物管理の品目マスタ |
| 配布先明細 | 配付物管理の会場別配布数量 |
| {期}Webアカウント管理 | リモート参加 Zoomブース割当・Tamaya機材 |
| 送信ログ | 集荷メール送信履歴 |
| リマインドログ | リマインドメール送信履歴 |
| 変更依頼 | 参加校からの担当者情報変更依頼 |
| SS差異確認 | 営業SSとの差異確認済みスナップショット |
| 取込ログ | CSV取込履歴（参加状況同期表示・取込履歴タブのソース） |
| 仕分表備考 | 参加状況ビューアの仕分表備考 |
| 資料管理 | 資料仕分け対象資料 |
| 資料仕分けチェック | 資料仕分け完了チェック |
| ペア校マスタ | 大学×短大のペア（短大データを大学にフォールバック表示する判定に使用） |
| 問題一覧 | `checkRepCode` の出力（法人マスタ代表校コードの整合性チェック結果） |

## 表示が遅い・古いと感じたら（キャッシュについて）

このシステムはデータの読み込みを速くするため、一時的にデータを保存（キャッシュ）しています。

| データ | キャッシュ時間 |
|---|---|
| 企画設定 | 30分 |
| 参加状況ビューア | 5分 |
| ダッシュボード | 5分 |

データを更新したのに画面に反映されない場合は、スプレッドシートのメニュー「システム」→「キャッシュクリア」を実行してからページを再読み込みしてください。
データの書込み（保存）を行った場合は、キャッシュは自動的にクリアされます。

## ソースコードの管理（開発者向け）

ソースコードは2つのGitHubリポジトリで管理されています：

| リポジトリ | 内容 | 公開設定 |
|---|---|---|
| `kz8/LuggageWebApp` | GAS本体（clasp管理） | Public |
| `kz8/eibi-form` | GitHub Pages（フロント・Wiki・ポータル） | Public |
| `kz8/eibi-csv-auto` | CSV自動取得（Playwright + GitHub Actions） | Private |

### clasp（GAS同期）

- 複数のパソコンで開発する場合は、**作業前に必ず `clasp pull`** で最新を取得してください
- `clasp push --force` は手元の内容でリモートを上書きします（マージ機能はありません）
- `clasp deployments` でデプロイ一覧を確認できます
- **WebApp系（OpView/Index/Receiving/Distribution/GuidanceMail/ReminderMail等）変更後は必ず GASエディタからデプロイ更新が必要**

### 主要なGASファイル

| ファイル | 役割 |
|---|---|
| LuggageWebApp.js | 顧客向け荷物登録フォームのサーバーサイド＋ doGet ルーティング |
| Index.html | 荷物登録フォーム UI |
| receivingHandler.js / ReceivingIndex.html | 入庫記録（QRスキャン/単校/法人一括/履歴） |
| Opview.js / OpViewIndex.html | 参加状況ビューア（9タブ） |
| Guidancemail.js / GuidanceMail.html | 集荷案内メール送信 |
| Remindermail.js / ReminderMail.html | リマインドメール送信 |
| distributionHandler.js / DistributionIndex.html | 配付物管理（5タブ） |
| materialSorting.js | 資料仕分け（OpView 4タブ目） |
| importCSV.js | CSV取込（4フェーズ化済み・タイムアウト対策） |
| clChangeNotifier.js | CL変更通知（営業SS差異＋変更依頼を1通にまとめて通知。土日スキップ） |
| boothLabel.js | リモートブース管理ラベルPDF生成 |
| luggageLabel.js | 荷札PDF生成（参加校向けフォームボタン＋管理者向け一括生成＋資料仕分け荷札） |
| **venueMatch.js** | 実施ガイドPDF抽出データ（GitHub Pages `eibi-form/docs/data/venues.json`）と企画設定の突合（2026-04-24追加） |
| **diagnosePair.js** | ペア校フォールバック診断ツール（手動実行用） |
| **checkSentDrafts.js** | Gmail送信済みフォルダ照合→ログを「下書き作成」→「成功」に更新（1日2回トリガー） |
| settingsHandler.js / SettingsIndex.html | 企画設定・物流設定の CRUD UI |

### 外部データ連携

| データソース | 用途 | 取得方法 |
|---|---|---|
| `kz8.github.io/eibi-form/data/venues.json` | 実施ガイドPDF抽出の会場住所データ（69件。会場ごとの郵便番号・住所・名称） | GAS から `UrlFetchApp` で取得（1hキャッシュ。`venueMatch.js`） |
| 営業SS（別スプレッドシート） | 担当者情報のマスター | OpView から差異検知＋反映 |
| Gmail送信済みフォルダ | 集荷案内・リマインドの実送信検知 | `checkSentDrafts.js` で1日2回照合 |
| Driveの参加申込CSV | 参加状況の取込元 | `importCSV.js` で15分ごと取込（2026-04-28以降。旧 1時間ごと） |
