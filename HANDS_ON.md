# Lunch Roulette - AI Agent Hands-on

> このファイルは進行用の資料。  
> Claude Codeには参照・変更させない。

## ゴール

人間が書いた簡単な要求メモから始めて、AIエージェントと以下の開発工程を進める。

1. 要件整理
2. 設計
3. 実装
4. 動作確認
5. テスト
6. 仕様変更（時間があれば）

最低到達ラインは「テスト完了」まで。

今回の目的は、コード生成そのものではなく、

> 要求 → 要件 → 設計 → 実装 → テスト

をAIエージェントがリポジトリ内の情報を参照しながら進める様子を体験してもらうこと。

---

# 0. 事前準備

## Codespaces

以下が利用できることを事前に確認する。

- GitHub Codespaces
- VS Code
- Claude Code VS Code拡張
- Claude Code CLI
- Node.js / npm
- Git

確認コマンド：

```bash
node --version
npm --version
git --version
claude --version
```

Claude Code CLIが起動・認証できることも確認しておく。

```bash
claude
```

---

## Node.js依存関係

テスト・ブラウザ確認に使用するツールは、ハンズオン中にインストールせず事前に準備しておく。

使用するもの：

- Vitest
- Playwright
- Chromium

`package.json` は事前配置しておく。

```json
{
  "name": "lunch-roulette",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^4.1.11",
    "playwright": "^1.55.0"
  }
}
```

事前に実行：

```bash
npm install
npx playwright install chromium
```

必要に応じて：

```bash
npx playwright install --with-deps chromium
```

以下がハンズオン開始前に成功することを確認する。

```bash
npm test
```

テストファイルがまだ存在しない場合の終了結果についても事前に確認しておく。

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

開始時点では以下を配置済みにしておく。

```text
.
├── CLAUDE.md
├── human_input.md
├── HANDS_ON.md
├── package.json
├── package-lock.json
└── .gitignore
```

`node_modules/` とPlaywright ChromiumもCodespace上では準備済みにしておく。

Git履歴には、事前準備までコミットしておく。

例：

```text
chore: add workshop starter files
chore: initial commit
```

ハンズオン開始時はWorking TreeがCleanな状態にする。

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
- ただし必要な情報は含まれている
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

内容は細かく説明しすぎず、「殴り書きが整理された」ことを見せる。

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

# 3. 実装する

### Claude Codeへの指示

> 要件と設計に従って実装してください。
>
> 実装後は要件を満たしているか確認し、実際のブラウザでも動作確認してください。

### 確認

Claude Codeが必要なファイルを作成していることを確認する。

想定例：

```text
src/
├── index.html
├── style.css
├── app.js
└── roulette.js
```

実際の構成はClaude Codeの設計に従う。

### ブラウザ確認

ここがデモの見せ場。

確認するポイント：

- Webサービスらしい見た目になっている
- 円形ルーレットが表示される
- SPINすると回転する
- 2〜3秒程度で徐々に停止する
- 停止位置と選択結果が一致する
- 結果がアニメーション付きで表示される
- 候補を追加できる
- 候補を削除できる
- 2件未満には削除できない

特に以下の状態を確認する。

### 初期6件

- ラベル位置が正しい
- ラベル同士が重ならない
- 文字の向きがおかしくない

### 候補2件

- 2つの領域が正しく分割される
- 2つのラベルが反対側に表示される
- ラベルが重ならない
- 文字が不自然な向きにならない

### PC / Mobile

- PCでは候補とルーレットが横並び
- スマホ相当では縦並び
- レイアウト崩れがない

### file://

最終的にローカルサーバーなしで、

```text
index.html
```

を直接開いて動作することを確認する。

HTTPサーバー経由で動くことだけを確認して完了扱いにしない。

---

## Playwrightについて

Claude Codeが必要と判断した場合は、事前導入済みのPlaywright / Chromiumを使ってよい。

用途：

- スクリーンショット確認
- PC / Mobile相当の表示確認
- DOM要素の位置確認
- ラベルの重なり確認
- 候補2件時の表示確認

Playwright自体の導入・Chromiumのダウンロードにハンズオン時間を使わない。

---

## Git確認

実装中も論理的な作業単位ごとにコミットされていることを確認する。

```bash
git log --oneline
```

想定例：

```text
style: improve roulette visual design
feat: implement roulette behavior
feat: add roulette base UI
docs: add application design
docs: define application requirements
```

コミット粒度は完全にこの通りでなくてもよい。

重要なのは「AIエージェントの作業過程がGitに残ること」。

---

# 4. テストする

### Claude Codeへの指示

> 要件、設計、現在の実装を確認してください。
>
> 必要なテストを作成し、実際にテストを実行してください。
> 問題が見つかった場合は原因を調査して修正してください。
>
> 自動テストだけでは確認できない画面表示についても、必要な動作確認を行ってください。

### 確認

想定例：

```text
tests/
└── roulette.test.js
```

Vitestを実行する。

```bash
npm test
```

特に確認したいロジック：

- 候補からランダムで1件選べる
- 候補追加
- 候補削除
- 2件未満には削除できない
- 選択結果と停止位置の計算が一致する

自動テストだけではなく、ブラウザ確認も実施されていることを見る。

特に：

- 6件
- 2件
- PC
- Mobile
- `file://`

を確認する。

Git履歴を確認する。

```bash
git log --oneline
```

ここまで到達すればハンズオン成功。

---

# 5. 仕様変更（時間があれば）

初期版が問題なく完成し、時間に余裕がある場合のみ実施する。

`human_input.md` に人間が追加要求を書く。

```text
追加で、過去に何が選ばれたか分かるようにしたい。

直近5回の抽選結果を画面に表示してほしい。
古いものから消えていけばOK。
画面を閉じた後まで保存する必要はない。
```

ポイント：

「仕様変更用の完璧なプロンプト」を書くのではなく、最初と同じように人間の要求を追加する。

### Claude Codeへの指示

> human_input.mdに要求を追加しました。
>
> 変更内容と現在の要件、設計、実装、テストを確認して対応してください。
> 必要な成果物を更新し、最後にテストと動作確認まで行ってください。

### 確認

Claude Codeが横断的に、

```text
human_input.md
       ↓
requirements.md
       ↓
design.md
       ↓
実装
       ↓
tests
```

を確認・更新する様子を見る。

ここでは、

> AIエージェントは新規開発だけではなく、既存成果物を読んで仕様変更にも対応できる

ことを見せる。

---

# 6. 最後にGit履歴を見る

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

AIエージェントが行った作業が、論理的な作業単位でGit履歴として残っていることを確認する。

伝えたいポイント：

> AIに任せても「何をしたのか分からない」のではなく、通常の開発と同じようにGitで変更履歴を追える。

---

# 7. 振り返り

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
仕様変更
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

各回で所要時間を記録する。

| 工程 | Rehearsal 1 | Rehearsal 2 | 本番目標 |
|---|---:|---:|---:|
| Claude Code開始 |  |  | 1分以内 |
| 要件整理 |  |  | 3分 |
| 設計 |  |  | 3分 |
| 実装・動作確認 |  |  | 8分 |
| テスト |  |  | 5分 |
| 仕様変更 |  |  | 5分 |
| 振り返り等 |  |  | 5分 |

特に記録すること：

- Claude Codeが想定外の質問をしたか
- npm installなど不要なセットアップを始めなかったか
- Gitコミット粒度
- ルーレット2件時の表示
- `file://` 動作
- Playwrightによる確認にかかった時間
- 修正・手戻りの原因
- 30分以内にどこまで到達できたか

リハーサル結果をもとに `human_input.md`、`CLAUDE.md`、事前環境を調整する。
