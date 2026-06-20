# WoS Battle Simulator 計算プロセスフロー図 (calculation_flow.md)

本ドキュメントは、ホワイトアウト・サバイバル (WoS) 戦闘シミュレーターにおけるダメージ・撃破数計算プロセス（[battleSimulator.js](./src/utils/battleSimulator.js) 内の実装）を Mermaid.js を用いて視覚化したものです。

---

## 計算プロセスフロー (4つのステップ)

GitHub上で本ファイルを表示すると、以下のMermaid記法に基づいたフローダイアグラムが自動的にレンダリングされて描画されます。

```mermaid
graph TD
    %% スタイル定義
    classDef step1 fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef step2 fill:#efebe9,stroke:#3e2723,stroke-width:2px;
    classDef step3 fill:#efe8ff,stroke:#4a148c,stroke-width:2px;
    classDef step4 fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef orchestrator fill:#fff3e0,stroke:#e65100,stroke-width:2px;

    subgraph Step1["【Step 1】実ステータスの算出 (calcActualStats)"]
        A1[攻撃側 基礎値] --> B1(実攻撃力 aAtk / 実殺傷力 aLet)
        A2[攻撃側 入力バフ%] --> B1
        A3[T11 弓兵パッシブ 1.06倍] --> B1
        
        A4[防御側 基礎値] --> B2(実防御力 dDef / 実HP dHp)
        A5[防御側 入力バフ%] --> B2
        A6[T11 盾兵パッシブ 1.06倍] --> B2
        A7[ブラッドリー効果 HP除算 /1.25 or /1.30] --> B2
    end
    class Step1,A1,B1,A2,A3,A4,B2,A5,A6,A7 step1;

    subgraph Step2["【Step 2】基本ダメージと撃破数（素値）の算出 (calcBaseDamage / calcRawKills)"]
        B1 --> C1("基本ダメージ係数 baseDmg<br>(aAtk * aLet) / (dDef * dHp) / 100")
        B2 --> C1
        C1 --> C2("通常撃破 / 追加撃破（素値）")
        C3[兵数平方根 / 開始時最小総兵数平方根] --> C2
        C4[有利相性 1.1倍 / 不利 1.0倍] --> C2
        C5[T7以上盾兵に対する槍軽減 /1.1] --> C2
    end
    class Step2,C1,C2,C3,C4,C5 step2;

    subgraph Step3["【Step 3】スキルモディファイアの計算 (calcSkillModifiers)"]
        D1[攻撃側 アクティブバフ] --> D3("モディファイア (normalSkillMod / exSkillMod)<br>※同カテゴリは加算 / 異カテゴリは乗算")
        D2[防御側 アクティブバフ] --> D3
        D4[ミアⅠ 被ダメバフ / ミアⅡ 追加ダメバフ] --> D3
        D5[無名 追加ダメ耐性置き換え処理] --> D3
        D3 -->|通常Mod / 追加Mod| C2
    end
    class Step3,D1,D3,D2,D4,D5 step3;

    subgraph Step4["【Step 4】T11兵士確率スキル適用と最終丸め (applyT11ProbabilitySkills)"]
        C2 --> E1{T11確率スキル抽選}
        E1 -->|15% 炎晶戦矛| F1[通常・追加ダメージ ×2.0]
        E1 -->|37.5% 烈晶盾| F2[被ダメージ /1.51]
        E1 -->|15% 熾烈領域| F3[被ダメージ /2.0]
        E1 -->|不発| F4[等倍]
        
        F1 --> G1("最終撃破数 = round(finalNormalKills + finalExtraKills)")
        F2 --> G1
        F3 --> G1
        F4 --> G1
    end
    class Step4,E1,F1,F2,F3,F4,G1 step4;

    G1 --> H1[calculateDamageSplit 返り値]
    class H1 orchestrator;
```

---

## 開発上の同期ルール (重要)

プロジェクト全体の開発規約として、以下が定められています。

> [!IMPORTANT]
> **ロジック変更時の同期ルール**
> 今後シミュレーターの戦闘計算ロジック（`src/utils/battleSimulator.js`）を変更・修正した際は、必ず以下のドキュメント類も合わせて同様に修正・更新し、同期させてください。
> 1.  [calculation_logic_summary.txt](./calculation_logic_summary.txt) : テキスト版仕様書
> 2.  [calculation_flow.md](./calculation_flow.md) : 本フロー図 (Mermaid)
