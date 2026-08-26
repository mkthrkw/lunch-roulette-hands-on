# 設計書: ランチルーレット

`docs/requirements.md` の要件を満たすための設計。実装（コード）はまだ書かない。

## 1. 全体構成

```
index.html          … 画面構造。file:// で直接開くエントリポイント
style.css           … 見た目・レイアウト・アニメーション
roulette-logic.js   … 候補管理・抽選・回転角度計算などの純粋ロジック（DOM非依存）
app.js              … DOM描画・イベント処理（roulette-logic.js を利用）
tests/
  roulette-logic.test.js … Vitest によるロジック単体テスト
package.json         … 既存。vitest / playwright を devDependency として利用
```

- ビルド・バンドラーは使わない。ブラウザは `<script>` を素朴に読み込むだけ。
- ロジック（`roulette-logic.js`）と描画・DOM操作（`app.js`）を分離し、要件4.4の自動テスト対象をロジック層に閉じ込める。

## 2. `file://` 対応・テスト可能性の両立方針

- 要件上、`index.html` を `file://` で直接開いて全機能が動作する必要がある。ES Modules（`<script type="module">`）はブラウザによって `file://` からの読み込みがCORSでブロックされるため使用しない。
- 代わりに `roulette-logic.js` は、ブラウザではグローバル関数として、Node（Vitest）では `module.exports` として振る舞う軽量パターンを採る。

```js
// roulette-logic.js の末尾イメージ（設計方針のみ、実装は次フェーズ）
const RouletteLogic = { MIN_CANDIDATES, addCandidate, removeCandidate, pickRandomIndex, computeSpinRotation, ... };

if (typeof module !== "undefined" && module.exports) {
  module.exports = RouletteLogic; // Vitest から import { addCandidate } ... で利用
} else {
  window.RouletteLogic = RouletteLogic; // index.html から <script src="roulette-logic.js"> で利用
}
```

- `index.html` では `<script src="roulette-logic.js"></script>`（非module）→`<script src="app.js"></script>` の順に読み込む。いずれも通常のスクリプトなので `file://` でも動作する。
- 外部フォント・外部CDNは使わず、OS標準フォントのみを指定する（要件の「外部API/ライブラリを使わない」「file://で完結」を満たすため）。

## 3. データ設計（状態）

`app.js` がモジュールスコープで保持するメモリ上の状態のみ。永続化はしない。

| 状態 | 型 | 説明 |
|---|---|---|
| `candidates` | `string[]` | 例: `["🍜 ラーメン", "🍛 カレー", ...]`。初期値6件 |
| `rotation` | `number` | ルーレットに現在適用している累積回転角度（度） |
| `isSpinning` | `boolean` | アニメーション中の多重クリック防止用 |

候補は絵文字とテキストをまとめた1つの文字列として扱う（分割管理はしない＝過剰な抽象化を避ける）。

## 4. `roulette-logic.js` の関数設計（テスト対象）

| 関数 | シグネチャ | 役割 |
|---|---|---|
| `MIN_CANDIDATES` | 定数 `2` | 最低保持件数 |
| `addCandidate` | `(candidates, text) => string[]` | 空文字/空白のみは無視し、新配列を返す |
| `removeCandidate` | `(candidates, index) => string[]` | `candidates.length <= MIN_CANDIDATES` の場合は変更せずそのまま返す（no-op） |
| `pickRandomIndex` | `(count) => number` | `Math.random()` を使い `0 <= n < count` の整数を1回だけ返す |
| `getSliceAngle` | `(count) => number` | `360 / count` |
| `getSliceCenterAngle` | `(index, count) => number` | 該当区画の中心角（0度=真上、時計回り） |
| `getLabelRotation` | `(centerAngle) => number` | ラベル用の回転角。中心角が90°〜270°の範囲（円の左半分）なら180°反転し、文字が逆さまにならないようにする |
| `computeSpinRotation` | `(currentRotation, winningIndex, count, extraTurns) => number` | 「ポインター（真上・0度）に `winningIndex` の中心角が一致する」ことを保証する、`currentRotation` より大きい新しい累積回転角を返す |

- `pickRandomIndex` と `computeSpinRotation` を分離することで、「選ばれた候補」と「停止位置」が同じ入力（winningIndex）から一意に計算され、矛盾が起きない構造にする（要件3.3・4.4に対応）。
- `computeSpinRotation` は概ね次の式で角度を決める：
  `目標角 = (360 - centerAngle(winningIndex)) mod 360`
  `新しい累積回転角 = currentRotation - (currentRotation mod 360) + 360 * extraTurns + 目標角`
  （常に現在値より大きくなるよう調整し、逆回転や巻き戻りを防ぐ）

## 5. ルーレット描画設計（SVG、Canvas不使用）

- `app.js` が候補数に応じて SVG (`<svg>` 内に `<path>` と `<text>`) を動的に生成する。
- 1候補 = 1 `<path>`（扇形）。中心角・開始角・終了角から極座標→直交座標に変換し `M/L/A/Z` のパスを組み立てる。
- 色はパステル系の固定カラーパレット（8色程度）を用意し、`index % palette.length` で割り当てる。2件でも6件でも自動的に色分けされる。
- ラベル（`<text>`）は各区画の中心角・一定半径（例: 半径の約65%）の位置に配置し、`transform="rotate(getLabelRotation(centerAngle), x, y)"` で向きを補正する。これにより件数に関わらずラベルが重ならず、上下逆さにもならない。
- ポインター（矢印）はSVGの外側、ルーレット上部中央にCSSの三角形（`border` トリック）で固定表示し、回転させない。

## 6. スピン演出設計

- SPINボタン押下時の処理順序：
  1. `isSpinning` が true なら何もしない（多重クリック防止）
  2. `pickRandomIndex(candidates.length)` で当選インデックスを決定
  3. `computeSpinRotation(rotation, winningIndex, candidates.length, extraTurns)` で新しい回転角を計算（`extraTurns` は3〜5回転程度の固定値で「勢いよく回る」演出を作る）
  4. ホイール要素に `transform: rotate(新しい角度deg)` を設定し、CSS `transition`（`duration: 2.5s` 程度、`cubic-bezier` の減速イージング）で見た目のアニメーションを発生させる
  5. `transitionend` で `isSpinning` を解除し、結果表示エリアに当選候補を表示（CSSアニメーションで軽く拡大しながらフェードイン）
- 実際の停止位置とロジック上の当選候補は同じ `winningIndex` に基づくため、演出（CSS）とデータ（JS）が食い違わない。

## 7. UI/レイアウト設計

- 全体を薄いオレンジ〜ピンクのグラデーション背景の上に、白いカード（角丸・box-shadow）を中央配置。
- PC幅（目安: 769px以上）は CSS Grid で2カラム：左＝候補リスト（追加フォーム＋削除可能なリスト）、右＝ルーレット＋SPINボタン＋結果表示。
- スマホ幅（目安: 768px以下）は1カラムに切り替え、ルーレット関連を先に、候補リストをその下に配置する（要件で「メインはルーレット」とされているため）。
- インタラクション：SPINボタン・削除ボタン・候補追加ボタンに `:hover` / `:active` のトランジション（拡大・色変化など軽微な変化）を付与する。
- フォントは太字見出し＋読みやすい本文サイズのシステムフォントスタックを使用する。

## 8. テスト設計

### 8.1 自動テスト（Vitest, `tests/roulette-logic.test.js`）

要件4.4「自動テスト」の各項目を、`roulette-logic.js` の関数単位で検証する。

| 要件項目 | 対応するテスト |
|---|---|
| 候補からランダムで1件選べる | `pickRandomIndex(count)` が常に `0 <= n < count` の整数を返すことを多数回試行で確認 |
| 候補追加ができる | `addCandidate` で件数が1増え、末尾に追加した文字列が入ることを確認 |
| 候補削除ができる | `removeCandidate` で件数が1減り、対象要素が除去されることを確認（件数が3以上のケース） |
| 2件未満には削除できない | 候補が2件のときに `removeCandidate` を呼んでも配列が変化しない（no-op）ことを確認 |
| 選ばれた候補と停止位置が矛盾しない | 任意の `winningIndex`・`count` について、`computeSpinRotation` の結果角度を360で割った余りが `getSliceCenterAngle(winningIndex, count)` を真上（0度）に一致させることを検証 |

`package.json` に既存の `vitest` をそのまま利用し、`npm test`（`vitest run`）で実行する。

### 8.2 手動確認（実ブラウザ、Playwright併用）

要件4.4の手動確認項目を、実装フェーズで実際のブラウザ（`index.html` を `file://` で開いた状態を含む）を用いて確認する。`package.json` に含まれる Playwright を、確認作業（スクリーンショット取得等）の補助に利用する。

- 初期状態（6件）／候補追加後／最低数2件まで削除した状態
- PC相当・スマホ相当の画面幅
- `file://` で直接開いた状態
- ルーレットのラベルの位置・向き・重なり、レイアウト崩れの有無

これは自動テストスイートとして常設するものではなく、実装内容が要件を満たしているかを目視確認する工程と位置づける（要件にない自動E2Eスイートの常設は行わない＝過剰な仕組みを避ける）。

## 9. 設計判断メモ（未確定事項への対応）

- 候補の最大件数：要件上上限の指定がないため設けない。カラーパレットは循環利用（8色をローテーション）することで、件数が多くても破綻なく色分けされる。
- SPIN連打時の挙動：`isSpinning` フラグでスピン中の再クリックを無視する、というシンプルな方針とする。
