# WOS戦闘シミュレーター リリースノート (V42)
**リリース日: 2026-06-16**

本バージョン（V42）では、戦闘シミュレーション計算のバグ修正、ターゲット追従ロジックの改善、確率スキルの適用条件の厳密化を行い、ゲーム実機とのシミュレーション精度の向上を図りました。

---

## 🛠 変更・修正詳細

### 1. バフ・デバフカテゴリ集計関数 (`sumBuffCategory`) の引数ズレ修正
* **対象箇所**: [battleSimulator.js](file:///home/hiroki/wos_battle_simulator/src/utils/battleSimulator.js#L173-L174)
* **不具合内容**: 特定の兵種を狙ったデバフ効果（`OppDefenseDown1`, `OppDefenseDown2`）を集計する際、引数の引き渡し順にズレがあり、攻撃側・防御側の兵種情報が正しく判定関数に伝わっていませんでした。これにより、一部のデバフ効果が計算から漏れるバグが発生していました。
* **修正内容**: `calculateDamageSplit` から `sumBuffCategory` を呼び出す際、攻撃側兵種 (`atkType`) を第3引数、防御側兵種 (`defType`) を第4引数として正しく設定し、デバフ対象が正しく評価されるように修正しました。

### 2. 槍兵「奇襲」発動時のターゲット追従とバフ引き継ぎの修正
* **対象箇所**: [battleSimulator.js](file:///home/hiroki/wos_battle_simulator/src/utils/battleSimulator.js#L409-L411), [battleSimulator.js](file:///home/hiroki/wos_battle_simulator/src/utils/battleSimulator.js#L468-L470), [battleSimulator.js](file:///home/hiroki/wos_battle_simulator/src/utils/battleSimulator.js#L570-L583)
* **不具合内容**: T11槍兵の「奇襲」が発動すると攻撃対象が「弓兵」に切り替わりますが、攻撃後に付与されるバフ（偶数回攻撃時バフ `spear_even_attack_after` 等）の付与先ターゲット判定において、奇襲先の「弓兵」ではなく、元の優先ターゲット（盾兵）の情報を引き継いでしまう不整合がありました。
* **修正内容**: 槍兵が攻撃した際に「実際に攻撃したターゲット」を `allySpearActualTarget` / `enemySpearActualTarget` に保存する処理を追加。ターン終了時のバフ引き継ぎ処理（`updateSpearActionBuffs`）でこの実際のターゲットを正確に引き継ぐようにし、奇襲先の「弓兵」に対して正しくデバフ等が適用されるよう修正しました。

### 3. ミアⅠスキルの抽選と適用ロジックの厳密化
* **対象箇所**: [battleSimulator.js](file:///home/hiroki/wos_battle_simulator/src/utils/battleSimulator.js#L421-L440)
* **不具合内容**: ミアⅠ（`mia_atk_prob_50`）の50%確率の被ダメ上昇デバフは各優先度フェーズの開始時に判定されますが、そのフェーズで行動可能な自軍/敵軍の部隊が存在するか（生存しているか）を考慮せずに無条件で抽選処理が走る記述になっていました。
* **修正内容**: 各優先度フェーズの開始時、そのフェーズで行動可能な自軍/敵軍 of 部隊（`atkTypeAlly` / `atkTypeEnemy`）が生存している場合のみ、厳密にミアⅠの抽選判定を行うように条件を追加しました。

### 4. UIの安全設計（Reactカスタム確認モーダルの導入）
* **対象箇所**: [WOS_battlesim.html](file:///home/hiroki/wos_battle_simulator/WOS_battlesim.html#L251-L263)
* **変更点**: シミュレーションのリセット（初期化）時にブラウザ標準の同期的な `confirm()` ダイアログを呼び出していたのを廃止し、Reactで構築したカスタム確認モーダルを導入しました。これにより、UXの統一感の向上と、誤操作によるバトルの初期化防止（安全設計）を実現しました。
