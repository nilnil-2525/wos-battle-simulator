# WoS Battle Simulator 計算プロセスフロー図 (calculation_flow.md)

本ドキュメントは、ホワイトアウト・サバイバル (WoS) 戦闘シミュレーターにおけるターン進行およびダメージ・撃破数計算プロセス（[battleSimulator.js](./src/utils/battleSimulator.js) およびそこから切り出された英雄スキル特殊処理モジュール [heroSkills.js](./src/utils/heroSkills.js) 内の実装）を Mermaid.js を用いて視覚化したものである。

---

## 1. ターン進行とスキル抽選フロー (processOneTurn)

シミュレーターが1ターンをどのように実行し、各英雄の確率スキルや効果がいつ抽選・適用されるかを示す。

```mermaid
graph TD
    classDef startEnd fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef heroSkill fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;

    Start[ターン開始] --> T1[永続/alwaysスキルの付与 ※1ターン目のみ]
    class Start startEnd;
    class T1 process;

    T1 --> T2{ターン開始時スキル抽選}
    class T2 decision;

    T2 -->|40%| T2_Mia["ミアⅢ (味方被ダメ軽減バフ付与)"]
    T2 -->|20%| T2_Greg["グレッグⅠ (味方全部隊殺傷バフ付与)"]
    T2 -->|その他| P_Start[フェーズ進行開始: 盾 ➔ 槍 ➔ 弓]
    class T2_Mia,T2_Greg heroSkill;
    class P_Start process;

    T2_Mia --> P_Start
    T2_Greg --> P_Start

    P_Start --> P_Check{行動可能部隊生存?}
    class P_Check decision;
    
    P_Check -->|No| Turn_End[ターン終了]
    class Turn_End startEnd;

    P_Check -->|Yes| P1{フェーズ開始時スキル抽選}
    class P1 decision;

    P1 -->|50%| P1_Mia["ミアⅠ (敵被ダメ増加デバフ付与)"]
    P1 -->|20%| P1_Greg["敵殺傷低下デバフ付与 (グレッグⅡ/ゴードンⅡ)"]
    P1 -->|20%| P1_Kisyu["T11槍奇襲 (槍ターゲットを弓に固定)"]
    P1 -->|通常| D_Calc[ダメージ計算実行 calculateDamageSplit]
    class P1_Mia,P1_Greg,P1_Kisyu heroSkill;
    class D_Calc process;

    P1_Mia --> D_Calc
    P1_Greg --> D_Calc
    P1_Kisyu --> D_Calc

    D_Calc --> P2{攻撃後・特殊処理判定}
    class P2 decision;

    P2 -->|槍の偶数回攻撃| P2_Gordon["ゴードンⅠ (追加ダメ & 敵殺傷低下バフ)"]
    P2 -->|5T毎/ソニヤⅢ| P2_Sonya["ソニヤⅢ (追加ダメ & 敵へスタン付与)"]
    P2 -->|3T毎/ヘンドリックⅢ| P2_Hendrick["ヘンドリックⅢ (敵全体へ追加狙撃)"]
    P2 -->|通常| P_End[フェーズ終了/次フェーズへ]
    class P2_Gordon,P2_Sonya,P2_Hendrick heroSkill;
    class P_End process;

    P2_Gordon --> P_End
    P2_Sonya --> P_End
    P2_Hendrick --> P_End

    P_End --> P_Check
```

---


## 1.5. processOneTurn と calculateDamageSplit の関係性とスキル判定タイミング

両関数は「全体進行」と「個別計算」という役割分担をしており、英雄・兵士のスキルもその処理の階層に応じて適切なタイミングで評価される。

### 💡 「ターン」と「フェーズ」の違い

* **ターン (Turn)**: 戦闘の全体的な進行単位（最大1000ターン）。1つのターン内に、生存している兵種ごとの「フェーズ」が最大3つ含まれる。ターン開始時に評価されるスキル（ミアⅢ、グレッグⅠ、周期系バフなど）はここで判定される。

* **フェーズ (Phase)**: 1ターン内における各兵種（優先度順: 盾 ➔ 槍 ➔ 弓）の個別行動ステップ。同じフェーズ内で、味方と敵の同一兵種がそれぞれ攻撃を行う（例: 「盾兵フェーズ」では味方盾兵と敵盾兵が同時に相手部隊を攻撃し、その後「槍兵フェーズ」へ進む）。フェーズ開始時に評価されるスキル（ミアⅠ、グレッグⅡデバフ、T11槍奇襲など）はこのタイミングで判定される。


| 階層 / 処理単位 | 担当関数 | 主な処理内容 | 評価される主なスキル・効果 |
| :--- | :--- | :--- | :--- |
| **① ターン全体** | `processOneTurn` (前半) | ターンの開始、周期効果の適用、全体バフの抽選 | ・**ミアⅢ** (40%味方被ダメ軽減)<br>・**グレッグⅠ** (20%味方殺傷バフ)<br>・3n/4n/5n 周期系バフ |
| **② フェーズ単位**<br>(優先度: 盾➔槍➔弓) | `processOneTurn` (中盤) | 生存判定、行動順の制御、奇襲判定、フェーズデバフの抽選 | ・**ミアⅠ** (50%敵被ダメ増加デバフ)<br>・**グレッグⅡ / ゴードンⅡ** (20%敵殺傷低下デバフ)<br>・**T11槍奇襲** (20%ターゲット固定) |
| **③ 攻撃・計算単位**<br>(各攻撃アクション) | `calculateDamageSplit` (内部) | 実ステータス算出、攻撃時の即時追加ダメージや兵士確率スキルの判定 | ・**ミアⅡ** (50%攻撃時追加ダメ)<br>・**ゴードンⅠ** (槍偶数回攻撃追加ダメ)<br>・**ソニヤⅢ** (5T毎追加ダメ&スタン)<br>・**T11弓兵確率スキル** (連射/燃晶火薬)<br>・**T11確率防御スキル** (烈晶盾/熾烈領域) |

---

## 2. ダメージ計算プロセス (calculateDamageSplit)

1回の攻撃フェーズで実行される詳細なダメージおよび撃破数の計算ロジック（4つのステップ）である。

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
        A7[攻撃側ブラッドリー効果 防御側HP除算 /1.25 or /1.30] --> B2
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
        D1[自軍アクティブバフ] --> D3("モディファイア (normalSkillMod / exSkillMod)")
        D2[敵軍デバフ/被ダメバフ] --> D3
        
        subgraph BuffAggregation["バフカテゴリの集計ルール (加算後、カテゴリ間で乗算)"]
            DA["① 分子カテゴリ (ダメージUP系)<br>・DamageUp1 (殺傷: ジェロニモI, グレッグI)<br>・DamageUp2 (与ダメ: ジェロニモIII, エディスI, ゴードンII, ブラッドリーIII)<br>・DamageUp3 (攻撃: ジェロニモII, ソニヤII, ブラッドリーI)<br>・NormalDamageUp (通常与ダメ: レイナ)<br>・OppDefenseDown1/2 (敵被ダメUP/敵防御低下: ミアI, ゴードンIII, ヘンドリックI)"]
            DB["② 分母カテゴリ (ダメージ軽減系)<br>・OppDamageDown1/2 (敵与ダメ低下/敵殺傷低下: グレッグII, ゴードンII/III)<br>・DefenseUp1 (部隊HP: エディスIII, グレッグIII)<br>・DefenseUp2 (部隊防御: ヘンドリックII)<br>・DefenseUp3 (被ダメ低下/通常耐性: エディスI/II, 無名I)<br>・DefenseUpS (特定軽減: T7盾など)"]
        end
        DA --> D3
        DB --> D3
        
        D4[ミアI/II 特殊処理] --> D3
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

プロジェクト全体の開発規約として、以下が定められている。

> [!IMPORTANT]
> **ロジック変更時の同期ルール**
> 今後シミュレーターの戦闘計算ロジック（`src/utils/battleSimulator.js`）を変更・修正した際は、必ず以下のドキュメント類も合わせて同様に修正・更新し、同期させること。
> 1.  [calculation_logic_summary.md](./calculation_logic_summary.md) : 仕様書
> 2.  [calculation_flow.md](./calculation_flow.md) : 本フロー図 (Mermaid)
