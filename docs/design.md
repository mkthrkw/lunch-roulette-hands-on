# 設計書: ランチルーレット

`docs/requirements.md` の要件に基づく設計。実装はまだ行わない。

## 1. 全体方針

- ビルドツールを使わず、ブラウザがそのまま解釈できるHTML/CSS/JavaScriptのみで
  実装する（T-1〜T-3）。`index.html` を `file://` で直接開いても動作すること
  （T-6）を満たすため、ES Modules（`import`/`export`）は使わず、通常の
  `<script>` として読み込む構成にする（ES Modulesはブラウザの仕様上、
  `file://` からのimportがCORS制限でブロックされるため）。
- ルーレットはCanvasを使わず、CSSの `conic-gradient` と `transform: rotate()` で表現する（T-2）。
- テスト対象のロジック（候補操作・ランダム選出・回転角計算）はDOM操作から独立した
  純粋関数として切り出し、Vitestで直接読み込んでテストできるようにする（T-4, T-5）。
- UI描画・イベント処理（DOM操作）とロジックを別ファイルに分離し、責務を明確にする。

## 2. ファイル構成

```
index.html
css/
  style.css
js/
  roulette-logic.js   … 純粋ロジック（DOM非依存、テスト対象）
  main.js             … DOM描画・イベント処理（RouletteLogicを参照して利用）
tests/
  roulette-logic.test.js
package.json          … devDependency: vitest
docs/
  requirements.md
  design.md
```

`roulette-logic.js` はimport/exportを使わない通常の`<script>`として実装し、
公開する関数・定数は `globalThis.RouletteLogic` にまとめて載せる。ブラウザでは
`index.html` が `roulette-logic.js` → `main.js` の順に`<script>`タグで読み込み、
`main.js` は `RouletteLogic.xxx` として参照する。Vitestからは
`import "../js/roulette-logic.js"` で副作用として読み込み、
`globalThis.RouletteLogic` から同じ関数を取り出してテストする。
同じファイルを両方から参照することで、実装とテストの二重管理を避ける。

## 3. 画面構成・レイアウト（L-1, L-2, D-1〜D-9）

```
┌───────────────────────────────────────────┐
│                 白いカード（角丸・影）        │
│ ┌───────────────┐   ┌─────────────────┐   │
│ │ ランチ候補       │   │     ルーレット     │   │
│ │ ・追加フォーム    │   │  （円形・色分け）  │   │
│ │ ・候補リスト      │   │  上部に矢印       │   │
│ │  （各行に削除ボタン）│   │  中央にSPINボタン │   │
│ └───────────────┘   └─────────────────┘   │
│              （結果表示エリア）              │
└───────────────────────────────────────────┘
  背景: 薄いオレンジ〜ピンクのグラデーション
```

- 広い画面（PC想定）では左右2カラム（`display: flex; flex-direction: row`）。
- 一定幅未満（スマホ想定、目安 768px）では `flex-direction: column` に切り替え、
  候補リスト→ルーレットの縦並びにする（メディアクエリで切替）。
- 結果表示エリアは初期状態は非表示または空、SPIN後にルーレットの下（またはカード内の
  結果専用領域）に表示する。

## 4. データモデル

候補は文字列（絵文字＋名前を1つの表示テキストとして保持、例: `"🍣 寿司"`）の配列として
アプリ内メモリ上に保持する（F-5: 永続化しない）。

```
candidates: string[]   // 例: ["🍜 ラーメン", "🍛 カレー", ...]
```

- 候補の色は候補ごとに保存せず、描画時にパステルカラーのパレット配列を
  インデックスに応じて循環的に割り当てる（D-6）。候補の増減で配列が変わっても
  常にその時点のインデックスから決定するため、状態として別途持つ必要がない。
- 候補の削除・追加はインデックス操作で行う（IDを別途発行しない）。同名候補が
  複数あってもインデックスで一意に扱えるため問題ない。

## 5. `roulette-logic.js`（純粋ロジック）

DOMに依存しない関数群。すべて引数を変更せず新しい値を返す（副作用なし）。

| 関数 | 役割 | 対応要件 |
|------|------|---------|
| `DEFAULT_CANDIDATES` | 初期候補6件の定数 | F-1 |
| `MIN_CANDIDATES = 2` | 最低保持件数の定数 | F-4 |
| `addCandidate(candidates, name)` | 候補を末尾に追加した新しい配列を返す | F-2 |
| `canRemove(candidates)` | 現在の件数が最低件数より多いかを返す | F-4 |
| `removeCandidate(candidates, index)` | 指定indexを除いた新しい配列を返す。`canRemove`がfalseの場合は元の配列をそのまま返す（削除しない） | F-3, F-4 |
| `pickRandomIndex(candidates)` | `Math.random()`を用いて有効なインデックスを1つ返す | F-11 |
| `getSegmentAngle(count)` | `360 / count` を返す | F-7, F-12 |
| `computeSpinRotation(currentRotation, count, targetIndex, extraSpins)` | 「必ず今より大きい回転角」かつ「その角度で停止したとき矢印がtargetIndexのセクター中心を指す」回転角(度)を返す | F-10, F-12 |
| `getIndexAtRotation(rotation, count)` | ある回転角のときに矢印が指しているセクターのindexを返す（`computeSpinRotation`の逆算・整合性検証用） | F-12 |

### 5.1 角度の考え方（F-12: 選出結果と停止位置の整合性）

- 角度0°をルーレット上部（矢印の位置）とし、時計回りを正とする。
- 候補は index 0 から時計回りに並び、各セクターの幅は `segAngle = 360 / count`。
  セクター `i` の範囲は `[i * segAngle, (i+1) * segAngle)`、中心角は
  `i * segAngle + segAngle / 2`。
- ルーレット要素全体を `rotate(r deg)` だけ時計回りに回転させたとき、矢印(角度0°)が
  指している元の角度は `(360 - (r mod 360)) mod 360` になる。
  これを `segAngle` で割って切り捨てた値が `getIndexAtRotation(r, count)`。
- `computeSpinRotation` は、狙った `targetIndex` のセクター中心が矢印の位置に来るように
  必要な `r mod 360` を逆算し、そこに「現在の回転角より確実に大きくなる分」と
  「勢いよく回るための追加回転数（`extraSpins` 周、既定値は複数回転）」を加算した
  絶対角度を返す。これにより常に同方向（時計回り）に回転が進み、かつ
  停止位置＝選出結果となることを保証する。
- この計算はランダム要素を含まない純粋な数式であるため、Vitestで
  「`computeSpinRotation`の結果を`getIndexAtRotation`に通すと`targetIndex`と一致する」ことを
  あらゆる候補数・目標indexの組み合わせで検証できる（TC-5）。

## 6. `main.js`（描画・イベント処理）

`roulette-logic.js` の関数を利用してDOMを更新する。ロジック自体は持たず、
状態（`candidates`, `currentRotation`, 描画中フラグ等）の保持とDOM反映に専念する。

| 処理 | 概要 | 対応要件 |
|------|------|---------|
| 候補リスト描画 | `candidates`をもとにリストと削除ボタンを描画。`canRemove`が`false`のときは削除操作を無効化する | F-2〜F-4 |
| 候補追加 | フォーム入力を`addCandidate`に渡し、結果で状態を更新してリストとルーレットを再描画 | F-2 |
| 候補削除 | `removeCandidate`を呼び、状態・リスト・ルーレットを再描画 | F-3, F-4 |
| ルーレット描画 | 候補数・パレットから`conic-gradient`の背景と各候補のラベル配置を生成 | F-6, F-7, D-6 |
| SPIN処理 | ①`pickRandomIndex`で選出 → ②`computeSpinRotation`で回転角を計算 → ③CSSの`transition`付きで回転を適用 → ④アニメーション終了後、選出結果を表示 | F-9〜F-13, A-1, A-2 |
| 結果表示 | アニメーション終了時に選ばれた候補を拡大表示するテキストとして描画 | F-13, A-2 |
| ホバー演出 | ボタン・削除アイコンに`:hover`のスタイルを適用（CSSのみで実現） | A-3 |

SPIN処理では、手順①で選ばれた`targetIndex`を最終的な結果表示にもそのまま使う
（回転角の計算と結果表示が同じ`targetIndex`に由来するため、表示と実際の停止位置が
食い違うことがない）。`getIndexAtRotation`はロジックの正しさをテストで検証するための
関数であり、UI側での二重チェックは必須としない。

連続クリックでアニメーションが破綻しないよう、回転中は再度のSPIN操作を
受け付けない状態を持つ（要件には明記されていないが、演出破綻を防ぐための最小限の制御とする）。

## 7. アニメーション（A-1, A-2, F-10）

- ルーレット要素に対し、CSSの`transition: transform 2.5s cubic-bezier(...)`のような
  「最初は速く、後半にかけて減速する」イージングを設定し、`transform: rotate(r deg)`の
  値をJS側で変更することで回転させる（2〜3秒で減速して停止：F-10）。
- 結果表示要素には、表示時に一瞬拡大してから通常サイズに戻るCSSアニメーション
  （`transform: scale()`の変化）を付与する（A-2）。
- ホバー演出（A-3）はCSSの`:hover`による`transform`や`box-shadow`の変化で表現し、
  JS側の実装は不要とする。

## 8. 見た目（D-1〜D-9）

- 背景: `linear-gradient()` で薄いオレンジ〜ピンクを指定（D-2）。
- カード: 白背景・`border-radius`・`box-shadow`（D-3〜D-5）。
- ルーレットの配色: パステル系カラーパレット（配列）を用意し、候補のインデックスに
  応じて`conic-gradient`の色指定に順番に割り当てる（D-6）。
- SPINボタン: 目立つ単色（例: 赤〜オレンジ系の強い色）で他要素と区別する（D-7）。
- フォント・文字色: 背景・カードいずれの上でも十分なコントラストを確保する（D-8）。
- 候補名に絵文字を含める（初期候補は要件の絵文字をそのまま使用）（D-9, F-1）。

## 9. テスト設計（Vitest）

`tests/roulette-logic.test.js` から `js/roulette-logic.js` を読み込み、
`globalThis.RouletteLogic` 経由でDOMを介さずロジックのみを検証する。

| テストケース | 内容 | 対応要件 |
|-------------|------|---------|
| TC-1 | `pickRandomIndex`が常に`0 <= index < candidates.length`を満たす値を返すことを、複数回の呼び出しで確認する | F-11 |
| TC-2 | `addCandidate`が候補を1件追加した新しい配列を返し、元の配列を変更しないことを確認する | F-2 |
| TC-3 | 候補が3件以上のとき`removeCandidate`が指定した候補を除いた配列を返すことを確認する | F-3 |
| TC-4 | 候補が2件のとき`removeCandidate`を呼んでも件数が2件のまま変化しない（削除されない）ことを確認する | F-4 |
| TC-5 | 候補数・目標indexの組み合わせを複数パターン用意し、`computeSpinRotation`の結果を`getIndexAtRotation`に渡すと常に元のtargetIndexと一致することを確認する | F-12 |
| (追加) | `computeSpinRotation`が毎回`EXTRA_SPIN_TURNS`周分以上の回転を追加すること（「勢いよく回る」演出が成立する最低条件）を確認する | F-10 |

`main.js`（DOM描画・イベント処理）は本設計では自動テストの対象外とし、
手動での動作確認とする（要件のテスト対象はロジック部分のみのため）。

## 10. 非対応・制約の確認（変更なし）

`docs/requirements.md` の 3.2（対象外）、10（前提事項）を踏襲する。
本設計もこれに反しない範囲で構成している。
