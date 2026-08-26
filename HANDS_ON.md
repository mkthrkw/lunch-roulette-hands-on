# Lunch Roulette - AI Agent Hands-on

> このファイルは発表者用の進行資料。  
> Claude Codeには参照・変更させない。

## ゴール

人間が書いた簡単な要求メモから始めて、AIエージェントと以下の開発工程を進める。

1. 要件整理
2. 設計
3. 実装・テスト・動作確認
4. 仕様変更（時間があれば）

最低到達ラインは「実装・テスト・動作確認完了」まで。

今回の目的はコード生成そのものではなく、

> 要求 → 要件 → 設計 → 実装 → テスト → 変更

をAIエージェントがリポジトリ内の情報を参照しながら進める様子を体験してもらうこと。

---

# 0. 事前準備

## Codespaces

以下が利用できることを事前に確認する。

- GitHub Codespaces
- VS Code
- Claude Code VS Code拡張
- Node.js / npm
- Git

確認コマンド：

```bash
node --version
npm --version
git --version
```

Claude Code VS Code拡張から正常に利用できることも事前に確認しておく。

---

## Node.js依存関係

テスト・ブラウザ確認に使用するツールは、ハンズオン中にインストールせず事前に準備しておく。

使用するもの：

- Vitest
- Playwright
- Chromium

`package.json`、`package-lock.json` は事前配置しておく。

事前に実行：

```bash
npm ci
npx playwright install chromium
```

Codespaces上でPlaywrightのChromiumが正常に起動することも確認しておく。

---

## Git / Branch

`main` ではハンズオンを実行しない。

リハーサル・本番ごとに事前に専用ブランチを作成する。

命名例：

```text
rehearsal/2026-08-30-01
rehearsal/2026-08-30-02

hands-on/2026-09-10-01
hands-on/2026-09-10-02
```

開始時に確認：

```bash
git branch --show-current
git status
git log --oneline
```

Claude Codeには現在のブランチ上で作業・コミットさせる。

`push` / `merge` は行わない。

---

## 開始時点

```text
.
├── CLAUDE.md
├── human_input.md
├── HANDS_ON.md
├── package.json
├── package-lock.json
└── .gitignore
```

`node_modules/` とPlaywright ChromiumもCodespaces上では準備済みにしておく。

Git履歴には事前準備までコミットしておく。

```text
chore: add workshop starter files
chore: initial commit
```

ハンズオン開始時はWorking TreeをCleanにする。

```bash
git status
```

---

# 1. 要求を確認する

最初に `human_input.md` を画面で見る。

ポイント：

- 特別なプロンプトではない
- 人間が書いた普通のメモ
- 形式は整っていない
- 必要な情報は含まれている
- AI向けの特殊な書き方をしなくても開始できる

### Claude Codeへの指示

> human_input.mdを確認してください。
>
> まず内容を整理して要件定義を行ってください。
> この時点では設計や実装は行わないでください。

### 確認

`docs/requirements.md` が作成されていることを確認する。

特に以下を見る。

- 利用方法
- 機能要件
- UI要件
- `file://` で直接開けること
- 候補数が2件の場合を含む表示要件
- テスト・動作確認条件

内容は細かく説明しすぎず、「人間のメモが構造化された」ことを見せる。

Git履歴を確認する。

```bash
git log --oneline
```

想定：

```text
docs: define application requirements
```

---

# 2. 設計する

### Claude Codeへの指示

> requirements.mdをもとに、このアプリケーションの設計を行ってください。
>
> この時点ではまだ実装しないでください。

### 確認

`docs/design.md` が作成されていることを確認する。

特に以下を見る。

- 画面構成
- ファイル構成
- ルーレットの選択ロジック
- ルーレットの表示方法
- 停止位置と選択結果を一致させる方法
- 候補数が変わった場合の表示方法
- `file://` で動作できる構成
- テスト方針
- 実ブラウザで確認する項目

Git履歴を確認する。

```bash
git log --oneline
```

想定：

```text
docs: add application design
docs: define application requirements
```

---

# 3. 実装・テスト・動作確認

### Claude Codeへの指示

> 要件と設計に従って実装してください。
>
> 実装した主要ロジックには必要なテストも作成し、テストを実行してください。
> 問題が見つかった場合は修正してください。
>
> 最後に実際のブラウザでも動作確認し、要件を満たしていることを確認してください。

### 確認

Claude Codeが必要なファイルを作成していることを確認する。

想定例：

```text
src/
├── index.html
├── style.css
├── app.js
└── roulette.js

tests/
└── roulette.test.js
```

実際の構成はClaude Codeの設計に従う。

### 自動テスト

Vitestが成功していることを確認する。

```bash
npm test
```

主な確認対象：

- 候補からランダムで1件選べる
- 候補追加
- 候補削除
- 2件未満には削除できない
- 選択結果と停止位置の計算が一致する

### ブラウザ確認

ここがデモの見せ場。

確認するポイント：

- Webサービスらしい見た目
- 円形ルーレットが表示される
- SPINすると回転する
- 2〜3秒程度で徐々に停止する
- 停止位置と選択結果が一致する
- 結果がアニメーション付きで表示される
- 候補を追加・削除できる

特に以下を確認する。

#### 初期6件

- ラベル位置が正しい
- ラベル同士が重ならない
- 文字の向きがおかしくない

#### 候補2件

- 2つの領域が正しく分割される
- ラベルが反対側に表示される
- ラベルが重ならない
- 文字の向きがおかしくない

#### PC / Mobile

- PCでは候補とルーレットが横並び
- スマホ相当では縦並び
- レイアウト崩れがない

#### file://

ローカルサーバーを使用せず `index.html` を直接開いて動作することを確認する。

HTTPサーバー経由だけの確認で完了扱いにしない。

### Playwright

Claude Codeが必要と判断した場合は、事前導入済みのPlaywright / Chromiumを利用してよい。

用途：

- スクリーンショット確認
- PC / Mobile相当の表示確認
- DOM要素の位置確認
- ラベルの重なり確認
- 候補2件時の表示確認

PlaywrightやChromiumのインストールにはハンズオン時間を使わない。

### Git確認

```bash
git log --oneline
```

想定例：

```text
test: add roulette logic tests
style: improve roulette visual design
feat: implement roulette behavior
feat: add roulette base UI
docs: add application design
docs: define application requirements
```

ここまで到達すればハンズオン成功。

---

# 4. 仕様変更（時間があれば）

初期版が完成し、時間に余裕がある場合のみ実施する。

今回は `human_input.md` は変更せず、追加仕様をClaude Codeへのプロンプトとして直接伝える。

### Claude Codeへの指示

> 仕様変更です。
>
> 直近5回の抽選結果を画面に表示できるようにしてください。
> 新しい結果を上に表示し、6件目以降の古い結果は表示しなくて構いません。
> 画面を閉じた後まで履歴を保存する必要はありません。
>
> この変更内容を既存の要件定義書と設計書に反映したうえで、実装と必要なテストも更新してください。
> 最後にテストとブラウザでの動作確認まで行ってください。

### 確認

Claude Codeが、

```text
追加仕様
   ↓
requirements.md 更新
   ↓
design.md 更新
   ↓
実装更新
   ↓
テスト更新
   ↓
動作確認
```

と既存成果物を横断して変更する様子を見る。

ここで伝えたいポイント：

> AIエージェントは新規開発だけでなく、既存の設計・コード・テストを理解して仕様変更にも対応できる。

Git履歴も確認する。

```bash
git log --oneline
```

仕様変更が論理的な単位でコミットされていることを見る。

---

# 5. 最後にGit履歴を見る

```bash
git log --oneline --graph
```

想定イメージ：

```text
feat: add recent roulette history
test: add roulette logic tests
style: improve roulette visual design
feat: implement roulette behavior
feat: add roulette base UI
docs: add application design
docs: define application requirements
chore: add workshop starter files
chore: initial commit
```

伝えたいポイント：

> AIに任せても「何をしたのか分からない」のではなく、通常の開発と同じようにGitで作業履歴を追える。

---

# 6. 振り返り

今回体験した流れ：

```text
human_input.md
人間の要求
      ↓
requirements.md
要件
      ↓
design.md
設計
      ↓
HTML / CSS / JavaScript
実装
      ↓
Vitest + Browser
テスト・動作確認
      ↓
Git
作業履歴
      ↓
追加仕様
      ↓
設計・実装・テストを横断更新
```

題材はランチルーレットだが、同じ考え方を、

- Webシステム
- API
- バッチ
- AWS Lambda
- 既存システム改修
- テスト追加
- ドキュメント整備

などにも応用できる。

重要なのは、

> 「AIにコードを書かせる」

だけではなく、

> 「リポジトリの情報をAIエージェントが読み、設計・実装・テスト・変更まで開発工程を横断して作業する」

という点。

---

# リハーサル記録

| 工程 | Rehearsal 1 | Rehearsal 2 | 本番目標 |
|---|---:|---:|---:|
| 開始・説明 |  |  | 3分 |
| 要件整理 |  |  | 3分 |
| 設計 |  |  | 3分 |
| 実装・テスト・動作確認 |  |  | 12分 |
| 仕様変更 |  |  | 5分 |
| Git確認・振り返り |  |  | 4分 |

特に記録すること：

- Claude Codeが想定外の質問をしたか
- 不要な `npm install` を実行しなかったか
- Gitコミット粒度
- 実装とテストを一連の作業として完了できたか
- ルーレット2件時の表示
- `file://` 動作
- Playwrightによる確認にかかった時間
- 修正・手戻りの原因
- 仕様変更まで30分以内に到達できたか

リハーサル結果をもとに `human_input.md`、`CLAUDE.md`、事前環境を調整する。
