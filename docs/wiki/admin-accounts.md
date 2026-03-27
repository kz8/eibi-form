# アカウント・権限

## 使用アカウント

| アカウント | 用途 |
|---|---|
| eibi.soudankai@gmail.com | GAS実行、Webアプリデプロイ、トリガー、集荷メール送信 |
| soudankai-s@eibi.co.jp | メール送信元エイリアス（from表示）|
| eibi.chikoshima@gmail.com | clasp開発、GitHub |

## メール経路

```
GAS（eibi.soudankai@gmail.com）
  ↓ from: soudankai-s@eibi.co.jp
  ↓
顧客アドレス宛に送信
  ＋ eibi.soudankai@gmail.com の送信済みにコピーが残る
```

## 転送設定

- soudankai-s@eibi.co.jp → eibi.soudankai@gmail.com（メールサーバー転送）

## デプロイ時の注意

- **必ず `eibi.soudankai@gmail.com` でデプロイすること**
- 別アカウントでデプロイすると、全Webアプリの実行アカウントが変わる
- CL変更検知トリガーも同アカウントで設定すること

## ポータルパスワード

- portal.html のパスワード: AES暗号化で保護
- パスワード変更時は暗号化データの再生成が必要
