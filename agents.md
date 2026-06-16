# Agents for WoS Battle Simulator

このドキュメントは、Whiteout Survival (WoS) バトルシミュレータの開発・テスト・検証を役割分担して実行するためのAIエージェントの定義です。

---

## 1. SimulatorLogicArchitect (シミュレータロジック設計エージェント)
- **役割**: 戦闘の物理演算・判定ロジックの実装と、[game-data.yaml](./public/game-data.yaml) のメンテナンス。
- **担当ファイル**:
  - [battleSimulator.js](./src/utils/battleSimulator.js) (コアロジック)
  - [calculation_logic_summary.txt](./calculation_logic_summary.txt) (仕様書)
- **タスク例**:
  - 未実装の「T8兵士スキル」や「ガトのシールド」の新規ロジック組み込み。
  - 新規追加された英雄スキルの数式モデル化。

---

## 2. FrontendUXEngineer (フロントエンドUX開発エージェント)
- **役割**: Vite + React環境でのUIコンポーネント実装、グラフ描画、バフ設定インターフェースの使いやすさ向上。
- **担当ファイル**:
  - [App.jsx](./src/App.jsx)
  - [ArmyPanel.jsx](./src/components/ArmyPanel.jsx)
  - [Charts.jsx](./src/components/Charts.jsx)
- **タスク例**:
  - 戦闘開始前のバフ値や英雄のスキルレベルを容易に入力・調整できるフォームの改修。
  - モンテカルロシミュレーションの進捗や結果分布（勝率、残兵数の中央値など）を視覚的に分かりやすく表示するダッシュボードの改善。

---

## 3. QualityAssuranceAgent (QA・テスト自動化エージェント)
- **役割**: シミュレーション動作の正当性を担保するテストケースの構築と自動実行。
- **担当範囲**:
  - スキル毎のユニットテストの構築。
  - 特定の極端な条件（例：兵数1 vs 100万、バフ0% vs 1000%）におけるシミュレータの例外処理・ゼロ除算バグ等の検出。
