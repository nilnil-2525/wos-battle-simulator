import { describe, it, expect, vi, afterEach } from 'vitest';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import {
    createInitialUnit,
    processOneTurn,
    applyBattleGameData
} from './battleSimulator.js';

// 本番のゲームデータを読み込んで適用する
const gameDataPath = path.resolve(__dirname, '../../public/game-data.yaml');
const gameData = yaml.load(fs.readFileSync(gameDataPath, 'utf8'));
applyBattleGameData(gameData);

const heroDB = gameData.initialHeroDB;

// YAMLテストケースの読み込み
const yamlPath = path.resolve(__dirname, './battleSimulator.test-cases.yaml');
const testCases = yaml.load(fs.readFileSync(yamlPath, 'utf8'));

describe('WOS Battle Simulator Table-Driven Tests', () => {
    
    // 各テストケースごとに Math.random() をリセットするためのクリーンアップ
    afterEach(() => {
        vi.restoreAllMocks();
    });

    testCases.forEach((tc) => {
        it(tc.name, () => {
            // 1. 軍隊初期状態の構築ヘルパー
            const buildArmy = (input) => {
                if (!input) return {
                    shield: createInitialUnit(11, 0, 0, 0, 0, 0),
                    spear: createInitialUnit(11, 0, 0, 0, 0, 0),
                    bow: createInitialUnit(11, 0, 0, 0, 0, 0),
                    heroes: { leaderShield: 'none', leaderSpear: 'none', leaderBow: 'none', rider1: 'none', rider2: 'none', rider3: 'none', rider4: 'none' },
                    spearAttackCount: 0,
                    activeBuffs: [],
                    stats: { heroSkillCounts: {} }
                };

                const getUnit = (type) => {
                    const u = input[type] || { tier: 11, troops: 0, attack: 0, lethality: 0, defense: 0, hp: 0 };
                    return createInitialUnit(u.tier, u.troops, u.attack, u.lethality, u.defense, u.hp);
                };

                const heroes = {
                    leaderShield: 'none', leaderSpear: 'none', leaderBow: 'none',
                    rider1: 'none', rider2: 'none', rider3: 'none', rider4: 'none',
                    ...(input.heroes || {})
                };

                return {
                    shield: getUnit('shield'),
                    spear: getUnit('spear'),
                    bow: getUnit('bow'),
                    heroes,
                    spearAttackCount: input.spearAttackCount !== undefined ? input.spearAttackCount : 0,
                    activeBuffs: [],
                    stats: { heroSkillCounts: {}, resshoCount: 0, kisyuCount: 0, enshoCount: 0, shiretsuCount: 0, renshaCount: 0, renshaKills: 0, nenshoCount: 0, nenshoKills: 0 }
                };
            };

            const ally = buildArmy(tc.ally);
            const enemy = buildArmy(tc.enemy);
            const currentArmyData = { ally, enemy };

            // 2. Math.random() のモック (デフォルトは 0.9 で確率スキル不発、特定フラグで 0.1 を返す)
            let randomValue = 0.9;
            if (tc.ally?.kisyu_active || tc.ally?.mia_i_active || tc.ally?.greg_active) {
                randomValue = 0.1;
            }
            vi.spyOn(Math, 'random').mockImplementation(() => randomValue);

            if (tc.ally?.mia_i_active) {
                // ミアIを持つ英雄 (mia) を槍リーダーにセット
                ally.heroes.leaderSpear = 'mia';
            }

            // 3. 進行処理の実行
            // 特殊な発動ターンのある固有スキルに対応するため実行ターン数を決定
            let runTurn = tc.run_turn || 1;
            if (!tc.run_turn) {
                if (tc.ally?.sonya_active) runTurn = 6;
                else if (tc.ally?.hendrick_active) runTurn = 3;
                else if (tc.ally?.mia_i_active) runTurn = 2;
            }
            
            let battleState = currentArmyData;
            let fixedMinTroops = Math.min(
                ally.shield.troops + ally.spear.troops + ally.bow.troops,
                enemy.shield.troops + enemy.spear.troops + enemy.bow.troops
            );

            // 指定ターンまで戦闘を進行させる
            for (let t = 1; t < runTurn; t++) {
                const tResult = processOneTurn(battleState, t, fixedMinTroops, heroDB, true);
                battleState = tResult.newArmyData;
            }

            // 検証対象ターンの実行
            const tResult = processOneTurn(battleState, runTurn, fixedMinTroops, heroDB, true);
            const nextAlly = tResult.newArmyData.ally;
            const nextEnemy = tResult.newArmyData.enemy;

            // 4. アサーション（期待値の検証）
            // 撃破数の検証 (敵の残兵数から逆算)
            if (tc.expected.kills_to_enemy !== undefined) {
                const initialEnemyTroops = enemy.shield.troops + enemy.spear.troops + enemy.bow.troops;
                const finalEnemyTroops = nextEnemy.shield.troops + nextEnemy.spear.troops + nextEnemy.bow.troops;
                const actualKills = initialEnemyTroops - finalEnemyTroops;
                expect(actualKills).toBe(tc.expected.kills_to_enemy);
            }

            // 味方の被撃破数 (敵から味方への撃破数) の検証
            if (tc.expected.kills_to_ally !== undefined) {
                const initialAllyTroops = ally.shield.troops + ally.spear.troops + ally.bow.troops;
                const finalAllyTroops = nextAlly.shield.troops + nextAlly.spear.troops + nextAlly.bow.troops;
                const actualAllyKills = initialAllyTroops - finalAllyTroops;
                expect(actualAllyKills).toBe(tc.expected.kills_to_ally);
            }

            // 奇襲発動時の攻撃対象の検証
            if (tc.expected.spear_action_buff_target !== undefined) {
                // 今回のV42で追加した actualTarget (バフ内の attackedTarget) から検証
                const spearActionBuff = nextAlly.activeBuffs.find(b => b.isSpearActionBuff);
                expect(spearActionBuff).toBeDefined();
                expect(spearActionBuff.attackedTarget).toBe(tc.expected.spear_action_buff_target);
            }

            // 敵のスタンによるターンオフセット（行動不能回数）の検証
            if (tc.expected.enemy_stun_turn_offset !== undefined) {
                expect(nextEnemy.stunTurnOffset || 0).toBe(tc.expected.enemy_stun_turn_offset);
            }

            // 英雄スキルの発動回数の検証
            if (tc.expected.skill_trigger_counts !== undefined) {
                Object.entries(tc.expected.skill_trigger_counts).forEach(([skillId, expectedCount]) => {
                    const actualSkillData = nextAlly.stats.heroSkillCounts[skillId] || nextEnemy.stats.heroSkillCounts[skillId];
                    const actualCount = actualSkillData ? actualSkillData.count : 0;
                    expect(actualCount).toBe(expectedCount);
                });
            }
        });
    });
});
