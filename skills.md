# Skills for WoS Battle Simulator

このドキュメントは、Whiteout Survival (WoS) バトルシミュレータの開発において、AIエージェントが備えるべき具体的なスキル（技術的役割・知識・手順）を定義します。

---

## 1. BattleEngineJsMaintenance (戦闘エンジンJS開発・修正)
戦闘計算の核となる [battleSimulator.js](./src/utils/battleSimulator.js) の仕様理解と、アルゴリズムの修正・機能追加。

### 知識領域
- 戦闘フェーズ（「盾 → 槍 → 弓」の攻撃順、奇襲、スタンなど）。
- ダメージ基礎式（`baseDmg`）と、各バフの適用カテゴリ（`DamageUp1` 〜 `DefenseUpS`）。
- スキル発動周期・タイミング（永続バフ、3T/4T周期バフ、確率発動バフ）。
- [calculation_logic_summary.txt](./calculation_logic_summary.txt) および [memo.txt](./memo.txt) に記述された暫定仕様（ガトのシールド、ミアの確率発動など）。

### 開発コマンド
- **JS依存関係のインストール**: `npm install`
- **開発サーバーの起動**: `npm run dev`（UIの変更やシミュレーションの直接確認用）

---

## 2. GameDataYamlManagement (YAMLゲームデータ管理)
[game-data.yaml](./public/game-data.yaml) のデータ構造を理解し、英雄パラメータや兵種ステータスをメンテナンス・追加するスキル。

### 知識領域
- 兵種のTierごとの基礎ステータス（`baseStatsData`：攻撃力、防御力、HP、殺傷力）。
- 英雄ごとのスキルツリー構造（`initialHeroDB`：スキルレベルごとの適用バフ、カテゴリ、対象、タイミング値）。
- 新規英雄（新世代英雄や特殊バフ持ち）が追加された際のYAMLへの定義追加手順。

---

## 3. PythonValidationTooling (Pythonによる戦闘ログ検証・ツール開発)
実機戦闘レポート（スクリーンショットからの抽出テキスト、ゲーム内チャットログ等）とシミュレータの誤差を統計的に分析・検証するためのPython製検証ツール群の開発。

### 開発環境
- **開発言語**: Python 3.12
- **パッケージ管理**: `uv`

### 開発アプローチ
- `uv init` によるPythonプロジェクトの初期化（必要に応じて）。
- `uv run scripts/verify.py` による検証ツールの実行。
- 実機戦闘データ（CSV/JSON）をパースし、シミュレータの出力分布と比較する統計解析コードの実装。
- JS側のシミュレータと同等の計算ロジックをPython 3.12でポーティングし、誤差箇所（例えばガトのシールド補正値のズレなど）を自動検知するデバッグスクリプトの作成。

---

## 4. FrontendComponentDevelopment (UI/UXコンポーネント開発)
Vite/React環境におけるシミュレータUIの改善、入力画面の拡張、チャート機能の強化。

### 知識領域
- [App.jsx](./src/App.jsx) におけるシミュレーション設定ステートの管理。
- [ArmyPanel.jsx](./src/components/ArmyPanel.jsx) に新規バフや英雄選択肢を追加するUI変更。
- [Charts.jsx](./src/components/Charts.jsx) を用いたモンテカルロシミュレーション結果（残兵のばらつき、勝率推移）の可視化改善。

---

## 5. GitOperationStandard (Git操作・コミット手順)
Gitリポジトリに対する変更をコミットする際の手順と厳格なルール。

### 必須ルール
- **コミット前の承認（厳守）**:
  Gitコミット（`git commit`）を実行する前に、必ず `git diff` の出力結果および変更のサマリ（何を変更したか）をユーザーに提示し、明示的な承認を得ること。ユーザーの許可なく勝手にコミットを行ってはならない。
