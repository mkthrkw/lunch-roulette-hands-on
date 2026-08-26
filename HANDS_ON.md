# Lunch Roulette - AI Agent Hands-on

## ゴール

人間が書いた簡単な要求メモから始めて、AIエージェントと以下の開発工程を進める。

1. 要件整理
2. 設計
3. 実装
4. 動作確認
5. テスト
6. 仕様変更（時間があれば）

最低到達ラインは「テスト完了」まで。

---

# 0. 開始前

以下が利用できることを確認する。

- GitHub Codespaces
- VS Code
- Claude Code
- Node.js / npm
- Git

開始時点では以下のファイルだけが存在する。

```text
.
├── CLAUDE.md
├── human_input.md
├── HANDS_ON.md
├── README.md
└── .gitignore
```

Gitの状態も確認しておく。

```bash
git status
git log --oneline
```

---

# 1. 要求を確認する

最初に `human_input.md` を見る。

ポイント：

- 特別なプロンプトではない
- 人間が書いた普通のメモ
- 形式は整っていない
- 必要な情報だけ書いてある

### Claude Codeへの指示

> human_input.mdを確認してください。
>
> まず内容を整理して要件定義を行ってください。
> この時点では設計や実装は行わないでください。

### 確認

`docs/requirements.md` が作成されていることを確認する。

必要に応じて内容を簡単に見る。

Git履歴も確認する。

```bash
git log --oneline
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
- UIの実現方法
- テスト方針

Git履歴を確認する。

```bash
git log --oneline
```

---

# 3. 実装する

### Claude Codeへの指示

> 要件と設計に従って実装してください。
>
> 実装完了後、アプリケーションを動作確認できる状態にしてください。

### 確認

Claude Codeが必要なファイルや依存関係を作成していることを確認する。

想定：

```text
src/
├── index.html
├── style.css
└── app.js

package.json
```

ブラウザでアプリを開く。

確認するポイント：

- 見栄えの良い画面になっている
- 円形ルーレットが表示される
- SPINで回転する
- 徐々に停止する
- 選択結果が表示される
- 候補を追加・削除できる

ここがデモの見せ場。

Git履歴も確認する。

```bash
git log --oneline
```

---

# 4. テストする

### Claude Codeへの指示

> 要件、設計、現在の実装を確認してください。
>
> 必要なテストを作成し、実際にテストを実行してください。
> 問題が見つかった場合は原因を調査して修正してください。

### 確認

想定：

```text
tests/
└── app.test.js
```

Vitestが成功することを確認する。

```bash
npm test
```

Git履歴を確認する。

```bash
git log --oneline
```

ここまで到達すればハンズオン成功。

---

# 5. 仕様変更（時間があれば）

`human_input.md` に人間が追加要求を書く。

例：

```text
追加で、過去に何が選ばれたか分かるようにしたい。

直近5回の抽選結果を画面に表示してほしい。
古いものから消えていけばOK。
画面を閉じた後まで保存する必要はない。
```

### Claude Codeへの指示

> human_input.mdに要求を追加しました。
>
> 変更内容と現在の要件、設計、実装、テストを確認して対応してください。
> 必要な成果物を更新し、最後にテストまで実行してください。

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

---

# 6. 最後にGit履歴を見る

```bash
git log --oneline
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
chore: initialize workshop repository
```

AIエージェントが行った作業がGit履歴として残っていることを確認する。

---

# 振り返り

今回体験した流れ：

```text
人間の要求
    ↓
要件
    ↓
設計
    ↓
実装
    ↓
テスト
    ↓
仕様変更
```

題材はランチルーレットだが、同じ考え方をWebシステム、API、バッチ、既存システム改修などにも応用できる。

重要なのは「AIにコードを書かせる」だけではなく、リポジトリの情報をAIエージェントが読み、開発工程を横断して作業できること。
