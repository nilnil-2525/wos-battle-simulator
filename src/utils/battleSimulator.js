// Whiteout Survival (WOS) Battle Simulator - Core Calculation Logic
// This file is React-independent and contains pure calculation functions.

import {
    handleHeroTurnStartSkills,
    handleHeroPhaseStartDebuffs,
    handleHeroPhaseStartBuffs,
    handleHeroAttackExtraDamage,
    handleHeroInstantAttackSkills,
    handleHeroHendrickSnipe
} from './heroSkills.js';

export let baseStatsData = {};

export const applyBattleGameData = (data) => {
    if (!data || !data.baseStatsData) {
        throw new Error('battleSimulator: game-data に baseStatsData が必要です。');
    }
    baseStatsData = data.baseStatsData;
};

export const createInitialUnit = (tier, troops, attack, lethality, defense, hp) => ({
    tier,
    initialTroops: troops,
    troops,
    buffs: { attack, lethality, defense, hp },
    stunned: false
});

export const createInitialStats = () => ({ 
    resshoCount: 0, kisyuCount: 0, enshoCount: 0, shiretsuCount: 0, renshaCount: 0, renshaKills: 0, nenshoCount: 0, nenshoKills: 0,
    heroSkillCounts: {} // { "heroName_skillLevel": count }
});

export const initialArmyState = {
    shield: createInitialUnit(11, 5000, 0, 0, 0, 0),
    spear: createInitialUnit(11, 3000, 0, 0, 0, 0),
    bow: createInitialUnit(11, 2000, 0, 0, 0, 0),
    heroes: { leaderShield: 'none', leaderSpear: 'none', leaderBow: 'none', rider1: 'none', rider2: 'none', rider3: 'none', rider4: 'none' },
    spearAttackCount: 0,
    activeBuffs: [],
    stats: createInitialStats()
};

export const MAX_BATTLE_TURNS = 1000;
export const MONTE_CARLO_RUNS = 1000;

export const SKILL_CATEGORY_OPTIONS = [
    { val: "DamageUp1", label: "DamageUp1 (分子: 与ダメUP/殺傷バフ)" }, { val: "DamageUp2", label: "DamageUp2 (分子: 与ダメUP/槍与ダメバフ等)" }, { val: "DamageUp3", label: "DamageUp3 (分子: 与ダメUP/攻撃バフ)" },
    { val: "NormalDamageUp", label: "NormalDamageUp (分子: 通常与ダメバフ)" }, { val: "ExtraDamageUp", label: "ExtraDamageUp (分子: 追加ダメージ枠)" },
    { val: "OppDefenseDown1", label: "OppDefenseDown1 (分子: 敵盾被ダメ上昇)" }, { val: "OppDefenseDown2", label: "OppDefenseDown2 (分子: 敵防御低下)" },
    { val: "DefenseUp1", label: "DefenseUp1 (分母: 被ダメ低下/全部隊HPバフ等)" }, { val: "DefenseUp2", label: "DefenseUp2 (分母: 被ダメ低下/全部隊防御バフ等)" },
    { val: "DefenseUp3", label: "DefenseUp3 (分母: 被ダメ低下/盾通常耐性等)" }, { val: "DefenseUpS", label: "DefenseUpS (分母: 被ダメ低下/ガト特殊盾被ダメ低下)" },
    { val: "OppDamageDown1", label: "OppDamageDown1 (分母: 敵殺傷低下)" }, { val: "OppDamageDown2", label: "OppDamageDown2 (分母: 敵攻撃低下)" },
    { val: "Hendrick3", label: "Hendrick3 (ヘンドリックⅢ専用: 3T毎敵全体追加攻撃)" }
];

export const SKILL_TARGET_OPTIONS = [
    { val: 'all', label: '味方全体' }, { val: 'shield', label: '味方盾兵' }, { val: 'spear', label: '味方槍兵' }, { val: 'bow', label: '味方弓兵' }, { val: 'self', label: '自身(攻撃部隊)' },
    { val: 'all_enemy', label: '敵全体' }, { val: 'enemy_shield', label: '敵盾兵' }, { val: 'enemy_spear', label: '敵槍兵' }, { val: 'enemy_bow', label: '敵弓兵' },
    { val: 'spear_target', label: '槍の攻撃対象' }, { val: 'enemy_target', label: '攻撃時の対象' }
];

export const SKILL_TIMING_OPTIONS = [
    { val: 'always', label: '永続' }, { val: 'turn_3n', label: '3T毎' }, { val: 'turn_4n', label: '4T毎' }, { val: 'turn_3n_instant', label: '3T毎即時' }, { val: 'turn_5n_instant', label: '5T毎即時(スタン)' },
    { val: 'after_shield_attack', label: '盾攻撃後' }, { val: 'spear_even_attack_after', label: '槍偶数回(後)' }, { val: 'spear_even_attack_instant', label: '槍偶数回(即時)' }, { val: 'spear_rene_timing', label: 'レネのタイミング' },
    { val: 'mia_atk_prob_50', label: 'ミア：各部隊攻撃時50%(2T~)' }, { val: 'mia_atk_prob_50_ex', label: 'ミア：各部隊攻撃時50%' }, { val: 'mia_turn_prob_40', label: 'ミア：ターン開始時40%' },
    { val: 'greg_turn_prob_20', label: 'グレッグ：ターン開始時20%' }, { val: 'greg_phase_prob_20', label: 'グレッグ：各フェーズ開始時20%' }
];

export const calcStats = (data) => {
    if (!data || data.length === 0) return { mean: 0, median: 0, variance: 0, stdDev: 0 };
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sorted.length;
    return { mean: Math.round(mean), median: Math.round(median), variance: Math.round(variance), stdDev: Math.round(Math.sqrt(variance)) };
};

export const getTotalTroops = (army) => army.shield.troops + army.spear.troops + army.bow.troops;

export const getTarget = (army) => {
    if (army.shield.troops > 0) return 'shield';
    if (army.spear.troops > 0) return 'spear';
    if (army.bow.troops > 0) return 'bow';
    return null;
};

export const buildSkillPool = (heroesObj, heroDB) => {
    const pool = [];
    const addSkills = (heroKey, levels) => {
        if (heroKey === 'none' || !heroDB[heroKey]) return;
        const levelSymbols = { 1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ' };
        levels.forEach(lvl => {
            if (heroDB[heroKey].skills[lvl]) {
                heroDB[heroKey].skills[lvl].forEach(skill => {
                    pool.push({ 
                        ...skill, 
                        heroKey: heroKey, 
                        heroName: heroDB[heroKey].name, 
                        simpleName: `${heroDB[heroKey].name}${levelSymbols[lvl]}`, 
                        name: `${skill.name}${(skill.value * 100).toFixed(1)}%` 
                    });
                });
            }
        });
    };
    addSkills(heroesObj.leaderShield, [1, 2, 3]);
    addSkills(heroesObj.leaderSpear, [1, 2, 3]);
    addSkills(heroesObj.leaderBow, [1, 2, 3]);
    addSkills(heroesObj.rider1, [1]);
    addSkills(heroesObj.rider2, [1]);
    addSkills(heroesObj.rider3, [1]);
    addSkills(heroesObj.rider4, [1]);
    return pool;
};

export const sumBuffCategory = (buffs, targetCategory, unitType, enemyTargetType, isMyBuff) => {
    let sum = 0;
    buffs.forEach(b => {
        if (b.category !== targetCategory) return;
        let match = false;
        if (isMyBuff) {
            if (b.target === 'all' || b.target === unitType || b.target === 'self') match = true;
        } else {
            if (b.target === 'all_enemy') match = true;
            if (targetCategory.startsWith('OppDefenseDown')) {
                if (b.target === `enemy_${enemyTargetType}`) match = true;
                if ((b.target === 'spear_target' || b.target === 'enemy_target') && b.attackedTarget === enemyTargetType) match = true;
            } else {
                if (b.target === `enemy_${unitType}`) match = true;
                if (targetCategory.startsWith('OppDamageDown')) {
                    if ((b.target === 'spear_target' || b.target === 'enemy_target') && b.attackedTarget === unitType) match = true;
                }
            }
        }
        if (match) sum += b.value;
    });
    return sum;
};

export const recordHeroSkill = (army, skill, logger, isSilent, isInstant = false) => {
    const skillId = `${skill.heroKey}_${skill.simpleName}`;
    if (!army.stats.heroSkillCounts[skillId]) {
        army.stats.heroSkillCounts[skillId] = { name: skill.simpleName, count: 0 };
    }
    army.stats.heroSkillCounts[skillId].count++;
    if (logger && !isSilent && isInstant) logger(`  ⚡ [即時スキル発動] ${skill.heroName}: ${skill.name}`);
};

/**
 * ステップ1: 兵種の基礎値とバフ・攻撃側リーダー補正から実ステータスを算出する
 * @param {string} atkType - 攻撃側の兵種 ('shield', 'spear', 'bow')
 * @param {string} defType - 防御側の兵種 ('shield', 'spear', 'bow')
 * @param {object} atkUnit - 攻撃側部隊の情報（tier, buffs 等）
 * @param {object} defUnit - 防御側部隊の情報（tier, buffs 等）
 * @param {string} atkLeaderBow - 攻撃側の弓兵リーダー名
 * @returns {object} 実ステータス { aAtk, aLet, dDef, dHp, hpDiv }
 */
export const calcActualStats = (atkType, defType, atkUnit, defUnit, atkLeaderBow) => {
    const atkBase = baseStatsData[atkType][atkUnit.tier];
    const defBase = baseStatsData[defType][defUnit.tier];

    // 攻撃側の弓兵リーダーがブラッドリー（bradley）の場合、防御側部隊のHPを除算（弱体化）する補正
    let hpDiv = 1.0;
    if (atkLeaderBow === 'bradley') {
        if (defType === 'shield') hpDiv = 1.25;
        if (defType === 'spear') hpDiv = 1.30;
    }

    // T11兵種特有 of 常時パッシブ補正 (弓攻撃1.06倍、盾防御1.06倍)
    const t11BowPassiveAtkMult = (atkType === 'bow' && atkUnit.tier === 11) ? 1.06 : 1.0;
    const t11ShieldPassiveDefMult = (defType === 'shield' && defUnit.tier === 11) ? 1.06 : 1.0;

    // 実ステータスの算出 (基礎値 × (1 + バフ%/100))
    const aAtk = atkBase.attack * (1 + atkUnit.buffs.attack / 100) * t11BowPassiveAtkMult;
    const aLet = atkBase.lethality * (1 + atkUnit.buffs.lethality / 100);
    const dDef = defBase.defense * (1 + defUnit.buffs.defense / 100) * t11ShieldPassiveDefMult;
    const dHp = (defBase.hp * (1 + defUnit.buffs.hp / 100)) / hpDiv;

    return { aAtk, aLet, dDef, dHp, hpDiv };
};

/**
 * ステップ2 (前半): 攻撃力・殺傷力および防御力・HPの実ステータスから基本ダメージ係数 (baseDmg) を計算する
 * @param {number} aAtk - 攻撃側実攻撃力
 * @param {number} aLet - 攻撃側実殺傷力
 * @param {number} dDef - 防御側実防御力
 * @param {number} dHp - 防御側実HP
 * @returns {number} baseDmg
 */
export const calcBaseDamage = (aAtk, aLet, dDef, dHp) => {
    return (aAtk * aLet) / (Math.max(1, dDef) * Math.max(1, dHp)) / 100;
};

/**
 * ステップ2 (後半): 基本ダメージ、相性、Mod、兵数平方根を乗算して撃破数の素値を算出する
 * @param {number} baseDmg - 基本ダメージ係数
 * @param {number} atkTroops - 攻撃側の現在兵数
 * @param {number} minTotalTroops - 戦闘開始時の最小総兵数
 * @param {number} multiplier - 兵種相性補正
 * @param {number} skillMod - 通常または追加のスキルモディファイア
 * @param {number} t7Reduc - T7以上盾兵による槍軽減補正
 * @returns {number} 撃破数（素値）
 */
export const calcRawKills = (baseDmg, atkTroops, minTotalTroops, multiplier, skillMod, t7Reduc) => {
    return baseDmg * Math.sqrt(atkTroops) * Math.sqrt(minTotalTroops) * multiplier * skillMod / t7Reduc;
};

/**
 * ステップ3: スキルバフを集計し、通常・追加攻撃のモディファイア（Mod）を計算する
 * @param {string} atkType - 攻撃側の兵種
 * @param {string} defType - 防御側の兵種
 * @param {array} myBuffs - 攻撃側のアクティブバフ一覧
 * @param {array} enemyBuffs - 防御側のアクティブバフ一覧
 * @param {number} miaOppDefDown - ミアⅠの被ダメージ上昇値
 * @param {number} exDmgUp - 追加ダメージの基本倍率
 * @returns {object} 通常・追加のスキルモディファイア、および各バフ集計値
 */
export const calcSkillModifiers = (atkType, defType, myBuffs, enemyBuffs, miaOppDefDown, exDmgUp) => {
    // 与ダメバフ・敵防御デバフ等の集計 (DamageUp / OppDefenseDown)
    const dmgUp1 = sumBuffCategory(myBuffs, 'DamageUp1', atkType, null, true);
    const dmgUp2 = sumBuffCategory(myBuffs, 'DamageUp2', atkType, null, true);
    const dmgUp3 = sumBuffCategory(myBuffs, 'DamageUp3', atkType, null, true);
    const normalDmgUp = sumBuffCategory(myBuffs, 'NormalDamageUp', atkType, null, true);
    const oppDefDown1 = sumBuffCategory(myBuffs, 'OppDefenseDown1', atkType, defType, false) + miaOppDefDown;
    const oppDefDown2 = sumBuffCategory(myBuffs, 'OppDefenseDown2', atkType, defType, false);
    
    // 防御バフ・被ダメ低下デバフ等の集計 (DefenseUp / OppDamageDown)
    const defUp1 = sumBuffCategory(enemyBuffs, 'DefenseUp1', defType, null, true);
    const defUp2 = sumBuffCategory(enemyBuffs, 'DefenseUp2', defType, null, true);
    const defUp3 = sumBuffCategory(enemyBuffs, 'DefenseUp3', defType, null, true);
    const defUpS = sumBuffCategory(enemyBuffs, 'DefenseUpS', defType, null, true);
    const oppDmgDown1 = sumBuffCategory(enemyBuffs, 'OppDamageDown1', atkType, defType, false);
    const oppDmgDown2 = sumBuffCategory(enemyBuffs, 'OppDamageDown2', atkType, defType, false);

    // 積算ルールに基づく通常攻撃Modの計算
    const normalNumerator = (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + normalDmgUp) * (1 + oppDefDown1) * (1 + oppDefDown2);
    const commonDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + defUp3) * (1 + defUpS);
    const normalSkillMod = normalNumerator / commonDenominator;

    // 追加攻撃時の置き換え処理 (防御側に「無名」がおり、被攻撃が盾兵かつ追加攻撃がある場合)
    let exDefUp3 = defUp3;
    if (enemyBuffs.some(b => b.heroName === '無名' && defType === 'shield') && exDmgUp > 0) {
        exDefUp3 = defUp3 - 0.25 + 0.30;
    }

    // 追加攻撃Modの計算 (通常与ダメUPである NormalDamageUp は追加ダメージには乗らない)
    const exDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + exDefUp3) * (1 + defUpS);
    const exNumerator = exDmgUp * (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + oppDefDown1) * (1 + oppDefDown2);
    const exSkillMod = exNumerator / exDenominator;

    return {
        normalSkillMod,
        exSkillMod,
        rawValues: { dmgUp1, dmgUp2, dmgUp3, normalDmgUp, oppDefDown1, oppDefDown2, defUp1, defUp2, defUp3, exDefUp3, defUpS, oppDmgDown1, oppDmgDown2 }
    };
};

/**
 * ステップ4: T11兵士の確率発動スキルを適用し、撃破数を四捨五入する
 * @param {string} atkType - 攻撃側兵種
 * @param {string} defType - 防御側兵種
 * @param {object} atkUnit - 攻撃側部隊情報
 * @param {object} defUnit - 防御側部隊情報
 * @param {number} rawNormal - 通常撃破（素値）
 * @param {number} rawExtra - 追加撃破（素値）
 * @param {object} stats - 統計記録用オブジェクト（兵士スキルカウント加算用）
 * @param {function} logger - ログ出力用関数
 * @param {boolean} isSilent - ログ出力を抑制するか
 * @param {boolean} isOverallHendrickAttacking - 全体ヘンドリック攻撃中か
 * @returns {object} { finalNormalKills, finalExtraKills, totalKills, spearDmgMult, shieldReceiveDiv, spearReceiveDiv }
 */
export const applyT11ProbabilitySkills = (atkType, defType, atkUnit, defUnit, rawNormal, rawExtra, stats, logger, isSilent, isOverallHendrickAttacking) => {
    // 槍兵攻撃時 15%確率で「炎晶戦矛」(通常・追加の与ダメ×2)
    let t11SpearDmgMult = 1.0;
    if (atkType === 'spear' && atkUnit.tier === 11 && !isOverallHendrickAttacking) {
        if (Math.random() < 0.15) {
            t11SpearDmgMult = 2.0;
            stats.enshoCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【炎晶戦矛】発動！`);
        }
    }

    // 盾兵被攻撃時 37.5%確率で「烈晶盾」(被ダメージ/1.51)
    let t11ShieldReceiveDiv = 1.0;
    if (defType === 'shield' && defUnit.tier === 11) {
        if (Math.random() < 0.375) {
            t11ShieldReceiveDiv = 1.51;
            stats.resshoCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 盾兵【烈晶盾】発動！`);
        }
    }

    // 槍兵被攻撃時 15%確率で「熾烈領域」(被ダメージ/2.0)
    let t11SpearReceiveDiv = 1.0;
    if (defType === 'spear' && defUnit.tier === 11) {
        if (Math.random() < 0.15) {
            t11SpearReceiveDiv = 2.0;
            stats.shiretsuCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【熾烈領域】発動！`);
        }
    }

    // T11のスキル補正を適用した撃破数を計算
    const finalNormalKills = rawNormal * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
    const finalExtraKills = rawExtra * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
    const totalKills = Math.round(finalNormalKills + finalExtraKills);

    return {
        finalNormalKills,
        finalExtraKills,
        totalKills,
        spearDmgMult: t11SpearDmgMult,
        shieldReceiveDiv: t11ShieldReceiveDiv,
        spearReceiveDiv: t11SpearReceiveDiv
    };
};

export const calculateDamageSplit = (atkType, defType, atkArmy, defArmy, minTotalTroops, logger, currentTurn, isEvenAttack, atkSkillPool, isOverallHendrickAttacking = false, isSilent = false, resolvedMiaOppDefDown = 0) => {
    const atkUnit = atkArmy[atkType];
    const defUnit = defArmy[defType];

    // ステップ1: 実ステータスの算出
    const { aAtk, aLet, dDef, dHp, hpDiv } = calcActualStats(atkType, defType, atkUnit, defUnit, atkArmy.heroes.leaderBow);

    const myBuffs = atkArmy.activeBuffs;
    const enemyBuffs = defArmy.activeBuffs;

    // ミアの攻撃時確率追加ダメージ（ミアⅡ）等の判定
    let miaOppDefDown = resolvedMiaOppDefDown;
    const miaExtraDmg = handleHeroAttackExtraDamage(isOverallHendrickAttacking, atkSkillPool, atkArmy, recordHeroSkill, logger, isSilent);

    // スキル追加ダメージ（ソニヤやゴードン等の偶数回攻撃 / 周期攻撃）の集計
    let exDmgUp = sumBuffCategory(myBuffs, 'ExtraDamageUp', atkType, null, true) + miaExtraDmg;
    let instantLog = "";
    let hasStunApplied = false;
    
    // T11弓兵の確率スキル（連射・燃晶火薬）の判定
    let t11BowExtraAtk = 0;
    let renshaActive = false;
    let nenshoActive = false;
    if (atkType === 'bow' && atkUnit.tier === 11 && !isOverallHendrickAttacking) {
        if (Math.random() < 0.10) {
            t11BowExtraAtk += 1.00;
            renshaActive = true;
            atkArmy.stats.renshaCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 弓兵【連射】発動！`);
        }
        if (Math.random() < 0.30) {
            t11BowExtraAtk += 0.875;
            nenshoActive = true;
            atkArmy.stats.nenshoCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 弓兵【燃晶火薬】発動！`);
        }
    }

    // 各英雄スキルの即時効果（ソニヤスタンや偶数回攻撃時の追加ダメージ加算）の集計
    const instantResult = handleHeroInstantAttackSkills(
        atkType,
        currentTurn,
        isEvenAttack,
        atkSkillPool,
        atkArmy,
        recordHeroSkill,
        logger,
        isSilent
    );
    exDmgUp += instantResult.exDmgUp;
    instantLog += instantResult.instantLog;
    if (instantResult.hasStunApplied) {
        hasStunApplied = true;
    }

    if (isOverallHendrickAttacking) exDmgUp = 0.40;
    else exDmgUp += t11BowExtraAtk;

    // ステップ3: スキルモディファイア（通常Mod、追加Mod）の計算
    const { normalSkillMod, exSkillMod, rawValues } = calcSkillModifiers(atkType, defType, myBuffs, enemyBuffs, miaOppDefDown, exDmgUp);

    // 有利相性マルチプライヤー (有利時 1.1倍)
    let multiplier = 1.0;
    if ((atkType === 'shield' && defType === 'spear') || (atkType === 'spear' && defType === 'bow') || (atkType === 'bow' && defType === 'shield')) {
        multiplier = 1.1;
    }

    // T7以上の盾兵に対する槍兵攻撃の特殊ダメージ減衰 (/1.1)
    let t7Reduc = 1.0;
    if (atkType === 'spear' && defType === 'shield' && defUnit.tier >= 7) {
        t7Reduc = 1.1;
    }

    // ステップ2: 基本ダメージと撃破数素値の計算
    const baseDmg = calcBaseDamage(aAtk, aLet, dDef, dHp);
    const rawNormal = isOverallHendrickAttacking ? 0 : calcRawKills(baseDmg, atkUnit.troops, minTotalTroops, multiplier, normalSkillMod, t7Reduc);
    const rawExtra = exDmgUp > 0 ? calcRawKills(baseDmg, atkUnit.troops, minTotalTroops, multiplier, exSkillMod, t7Reduc) : 0;

    // ステップ4: T11確率スキルの適用と丸め処理
    const { finalNormalKills, finalExtraKills, totalKills, spearDmgMult: t11SpearDmgMult, shieldReceiveDiv: t11ShieldReceiveDiv, spearReceiveDiv: t11SpearReceiveDiv } = 
        applyT11ProbabilitySkills(atkType, defType, atkUnit, defUnit, rawNormal, rawExtra, atkArmy.stats, logger, isSilent, isOverallHendrickAttacking);

    // T11弓兵の連射/燃晶火薬による撃破数を統計記録
    if (renshaActive) atkArmy.stats.renshaKills += Math.round(finalExtraKills * (1.00 / exDmgUp));
    if (nenshoActive) atkArmy.stats.nenshoKills += Math.round(finalExtraKills * (0.875 / exDmgUp));

    // ログ出力処理
    let detailLog = "";
    if (!isSilent) {
        const formatMult = (...vals) => {
            const factors = vals.filter(v => v !== 0).map(v => (1 + v).toFixed(2));
            return factors.length > 0 ? factors.join(' × ') : '1.00';
        };
        const dmgUpStr = formatMult(rawValues.dmgUp1, rawValues.dmgUp2, rawValues.dmgUp3, rawValues.normalDmgUp);
        const oppDefDownStr = formatMult(rawValues.oppDefDown1, rawValues.oppDefDown2);
        const oppDmgDownStr = formatMult(rawValues.oppDmgDown1, rawValues.oppDmgDown2);
        const defUpStr = formatMult(rawValues.defUp1, rawValues.defUp2, rawValues.defUp3, rawValues.defUpS);
        const exDefUpStr = formatMult(rawValues.defUp1, rawValues.defUp2, rawValues.exDefUp3, rawValues.defUpS);

        detailLog += `  ┣ [計算内訳]:\n`;
        if (instantLog !== "") detailLog += `  ┃ ⚡即時追加: ${instantLog}\n`;
        if (!isOverallHendrickAttacking) {
            detailLog += `  ┃ [通常Mod]: (${dmgUpStr} [与ダバフ] × ${oppDefDownStr} [被ダ増]) / (${oppDmgDownStr} [攻撃低下] × ${defUpStr} [被ダ低下]) = ${normalSkillMod.toFixed(3)}\n`;
        }
        if (exDmgUp > 0) {
            const exDmgUpStr = formatMult(rawValues.dmgUp1, rawValues.dmgUp2, rawValues.dmgUp3);
            detailLog += `  ┃ [追加Mod]: (${exDmgUp.toFixed(2)} [追加倍率] × ${exDmgUpStr} [通常乗算] × ${oppDefDownStr} [被ダ増]) / (${oppDmgDownStr} [攻撃低下] × ${exDefUpStr} [被ダ低下+無名]) = ${exSkillMod.toFixed(3)}\n`;
        }

        let baseNormalStr = Math.round(rawNormal).toLocaleString();
        let baseExtraStr = Math.round(rawExtra).toLocaleString();
        let t11Mods = [];
        if (t11SpearDmgMult > 1) t11Mods.push(`炎晶戦矛×2`);
        if (t11ShieldReceiveDiv > 1) t11Mods.push(`烈晶盾/1.51`);
        if (t11SpearReceiveDiv > 1) t11Mods.push(`熾烈領域/2`);
        let modStr = t11Mods.length > 0 ? ` ➔ [${t11Mods.join(", ")}]` : "";

        detailLog += `  ┗ [撃破数]:\n`;
        if (exDmgUp > 0) {
            detailLog += `     通常: ${baseNormalStr}人${modStr} = ${Math.round(finalNormalKills).toLocaleString()}人\n`;
            detailLog += `     追加: ${baseExtraStr}人${modStr} = ${Math.round(finalExtraKills).toLocaleString()}人`;
        } else {
            detailLog += `     通常: ${baseNormalStr}人${modStr} = ${Math.round(finalNormalKills).toLocaleString()}人`;
        }
    }

    return { totalKills, hasStunApplied, detailLog };
};

export const triggerBuffs = (army, skillPool, triggerName, logger, sideName, isSilent) => {
    skillPool.forEach(skill => {
        if (skill.timing === triggerName) {
            const isExist = army.activeBuffs.some(b => b.heroName === skill.heroName && b.name === skill.name && b.remain === skill.duration);
            if (!isExist) {
                army.activeBuffs.push({ ...skill, remain: skill.duration });
                recordHeroSkill(army, skill, logger, isSilent, true);
            }
        }
    });
};

export const processOneTurn = (currentArmyData, currentTurn, fixedMinTroopsSetting, heroDB, isSilent = false) => {
    let ally = JSON.parse(JSON.stringify(currentArmyData.ally));
    let enemy = JSON.parse(JSON.stringify(currentArmyData.enemy));
    let newLogs = isSilent ? [] : [`==== ターン ${currentTurn} ====`];
    const logger = (msg) => { if(!isSilent) newLogs.push(msg); };

    const allySkillPool = buildSkillPool(ally.heroes, heroDB);
    const enemySkillPool = buildSkillPool(enemy.heroes, heroDB);

    if (currentTurn === 1) {
        allySkillPool.filter(s => s.timing === 'always').forEach(s => ally.activeBuffs.push({ ...s, remain: 999 }));
        enemySkillPool.filter(s => s.timing === 'always').forEach(s => enemy.activeBuffs.push({ ...s, remain: 999 }));
    }

    handleHeroTurnStartSkills(ally, allySkillPool, recordHeroSkill, logger, isSilent);
    handleHeroTurnStartSkills(enemy, enemySkillPool, recordHeroSkill, logger, isSilent);

    if (ally.spear.troops > 0 && ally.spear.tier === 11) {
        if (enemy.bow.troops > 0 && Math.random() < 0.20) { 
            ally.spear.kisyuActiveThisTurn = true; 
            ally.stats.kisyuCount++; 
            if(!isSilent) logger(`🎲 [兵士スキル] 味方槍兵【奇襲】ターゲットを敵弓兵に固定。`); 
        } else {
            ally.spear.kisyuActiveThisTurn = false;
        }
    } else {
        ally.spear.kisyuActiveThisTurn = false;
    }

    if (enemy.spear.troops > 0 && enemy.spear.tier === 11) {
        if (ally.bow.troops > 0 && Math.random() < 0.20) { 
            enemy.spear.kisyuActiveThisTurn = true; 
            enemy.stats.kisyuCount++; 
            if(!isSilent) logger(`🎲 [兵士スキル] 敵槍兵【奇襲】ターゲットを味方弓兵に固定。`); 
        } else {
            enemy.spear.kisyuActiveThisTurn = false;
        }
    } else {
        enemy.spear.kisyuActiveThisTurn = false;
    }

    ['turn_3n', 'turn_4n', 'turn_5n'].forEach(timing => {
        const n = parseInt(timing.split('_')[1]);
        const allyEffTurn = currentTurn - (ally.stunTurnOffset || 0);
        const enemyEffTurn = currentTurn - (enemy.stunTurnOffset || 0);
        if (allyEffTurn > 0 && allyEffTurn % n === 0) triggerBuffs(ally, allySkillPool, timing, logger, "味方", isSilent);
        if (enemyEffTurn > 0 && enemyEffTurn % n === 0) triggerBuffs(enemy, enemySkillPool, timing, logger, "敵", isSilent);
    });

    const allyEffTurn3 = currentTurn - (ally.stunTurnOffset || 0);
    const enemyEffTurn3 = currentTurn - (enemy.stunTurnOffset || 0);
    if (allyEffTurn3 >= 3 && (allyEffTurn3 % 2 === 1)) triggerBuffs(ally, allySkillPool, 'spear_rene_timing', logger, "味方", isSilent);
    if (enemyEffTurn3 >= 3 && (enemyEffTurn3 % 2 === 1)) triggerBuffs(enemy, enemySkillPool, 'spear_rene_timing', logger, "敵", isSilent);

    const getActivePhases = (army) => {
        const a = [];
        if (army.shield.troops > 0) a.push('shield');
        if (army.spear.troops > 0) a.push('spear');
        if (army.bow.troops > 0) a.push('bow');
        return a;
    };
    const allyPhases = getActivePhases(ally);
    const enemyPhases = getActivePhases(enemy);
    const maxActivePhases = Math.max(allyPhases.length, enemyPhases.length);
    
    const turnAllyTargetNormal = getTarget(enemy); 
    const turnEnemyTargetNormal = getTarget(ally);

    let allySpearAttackedThisTurn = false, allySpearEvenAttackOccurred = false;
    let enemySpearAttackedThisTurn = false, enemySpearEvenAttackOccurred = false;
    let allySpearActualTarget = null;
    let enemySpearActualTarget = null;

    for (let i = 0; i < maxActivePhases; i++) {
        const atkTypeAlly = allyPhases[i];
        const atkTypeEnemy = enemyPhases[i];
        if (!atkTypeAlly && !atkTypeEnemy) continue;
        if(!isSilent) logger(`--- [優先度フェーズ ${["Ⅰ", "Ⅱ", "Ⅲ"][i] || i+1}] ---`);

        let killsToEnemy = 0, killsToAlly = 0;
        let applyAllyStunToEnemy = false, applyEnemyStunToAlly = false;

        const allyResolvedMiaOppDefDown = handleHeroPhaseStartDebuffs(currentTurn, atkTypeAlly, allySkillPool, ally, recordHeroSkill, logger, isSilent);
        const enemyResolvedMiaOppDefDown = handleHeroPhaseStartDebuffs(currentTurn, atkTypeEnemy, enemySkillPool, enemy, recordHeroSkill, logger, isSilent);

        handleHeroPhaseStartBuffs(atkTypeAlly, ally, enemy, allySkillPool, recordHeroSkill, logger, isSilent);
        handleHeroPhaseStartBuffs(atkTypeEnemy, enemy, ally, enemySkillPool, recordHeroSkill, logger, isSilent);

        if (atkTypeAlly && ally[atkTypeAlly].troops > 0) {
            if (ally[atkTypeAlly].stunned) {
                if(!isSilent) logger(`🌀 [味方 ${atkTypeAlly}] は行動不能（スタン中）のため、攻撃をパスしました。`);
                ally[atkTypeAlly].stunned = false;
                ally.stunTurnOffset = (ally.stunTurnOffset || 0) + 1; 
            } else {
                const finalAllyTarget = (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) ? 'bow' : turnAllyTargetNormal;
                if (finalAllyTarget && enemy[finalAllyTarget].troops > 0) {
                    const isEvenAttack = (atkTypeAlly === 'spear' && (ally.spearAttackCount + 1) % 2 === 0);
                    const result = calculateDamageSplit(atkTypeAlly, finalAllyTarget, ally, enemy, fixedMinTroopsSetting, logger, currentTurn, isEvenAttack, allySkillPool, false, isSilent, allyResolvedMiaOppDefDown);
                    killsToEnemy = result.totalKills;
                    applyAllyStunToEnemy = result.hasStunApplied;
                    if(!isSilent) {
                        logger(`▶ [味方 ${atkTypeAlly}] ➔ [敵 ${finalAllyTarget}] へ攻撃`);
                        if (result.detailLog) logger(result.detailLog);
                        logger(`   💥 最終撃破: ${killsToEnemy.toLocaleString()}人`);
                    }
                } else {
                    if (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) {
                        if(!isSilent) logger(`▶ [味方 槍兵] ➔ [敵 bow] 🎯 奇襲を試みましたが、敵に弓兵が生存していないため「空振り」しました。`);
                    } else {
                        if(!isSilent) logger(`▶ [味方 ${atkTypeAlly}] ➔ [敵 ${finalAllyTarget || 'なし'}] ターゲットが全滅しているため「空振り」しました。`);
                    }
                }
                if (atkTypeAlly === 'spear') {
                    allySpearAttackedThisTurn = true;
                    allySpearActualTarget = finalAllyTarget; // 奇襲ターゲット保存
                    ally.spearAttackCount++;
                    if (ally.spear.troops > 0 && ally.spearAttackCount % 2 === 0) allySpearEvenAttackOccurred = true;
                }
                
                handleHeroHendrickSnipe(
                    atkTypeAlly,
                    currentTurn,
                    allySkillPool,
                    ally,
                    enemy,
                    recordHeroSkill,
                    calculateDamageSplit,
                    fixedMinTroopsSetting,
                    logger,
                    isSilent,
                    allyResolvedMiaOppDefDown,
                    "味方",
                    "敵"
                );
            }
        }

        if (atkTypeEnemy && enemy[atkTypeEnemy].troops > 0) {
            if (enemy[atkTypeEnemy].stunned) {
                if(!isSilent) logger(`🌀 [敵 ${atkTypeEnemy}] は行動不能（スタン中）のため、攻撃をパスしました。`);
                enemy[atkTypeEnemy].stunned = false;
                enemy.stunTurnOffset = (enemy.stunTurnOffset || 0) + 1; 
            } else {
                const finalEnemyTarget = (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) ? 'bow' : turnEnemyTargetNormal;
                if (finalEnemyTarget && ally[finalEnemyTarget].troops > 0) {
                    const isEvenAttack = (atkTypeEnemy === 'spear' && (enemy.spearAttackCount + 1) % 2 === 0);
                    const result = calculateDamageSplit(atkTypeEnemy, finalEnemyTarget, enemy, ally, fixedMinTroopsSetting, logger, currentTurn, isEvenAttack, enemySkillPool, false, isSilent, enemyResolvedMiaOppDefDown);
                    killsToAlly = result.totalKills;
                    applyEnemyStunToAlly = result.hasStunApplied;
                    if(!isSilent) {
                        logger(`▶ [敵 ${atkTypeEnemy}] ➔ [味方 ${finalEnemyTarget}] へ攻撃`);
                        if (result.detailLog) logger(result.detailLog);
                        logger(`   💥 最終撃破: ${killsToAlly.toLocaleString()}人`);
                    }
                } else {
                    if (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) {
                        if(!isSilent) logger(`▶ [敵 槍兵] ➔ [味方 bow] 🎯 奇襲を試みましたが、味方に弓兵が生存していないため「空振り」しました。`);
                    } else {
                        if(!isSilent) logger(`▶ [敵 ${atkTypeEnemy}] ➔ [味方 ${finalEnemyTarget || 'なし'}] ターゲットが全滅しているため「空振り」しました。`);
                    }
                }
                if (atkTypeEnemy === 'spear') {
                    enemySpearAttackedThisTurn = true;
                    enemySpearActualTarget = finalEnemyTarget; // 奇襲ターゲット保存
                    enemy.spearAttackCount++;
                    if (enemy.spear.troops > 0 && enemy.spearAttackCount % 2 === 0) enemySpearEvenAttackOccurred = true;
                }
                
                handleHeroHendrickSnipe(
                    atkTypeEnemy,
                    currentTurn,
                    enemySkillPool,
                    enemy,
                    ally,
                    recordHeroSkill,
                    calculateDamageSplit,
                    fixedMinTroopsSetting,
                    logger,
                    isSilent,
                    enemyResolvedMiaOppDefDown,
                    "敵",
                    "味方"
                );
            }
        }

        if (killsToEnemy > 0 && turnAllyTargetNormal) {
            const t = (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) ? 'bow' : turnAllyTargetNormal;
            if (enemy[t]) {
                enemy[t].troops = Math.max(0, enemy[t].troops - killsToEnemy);
                if (applyAllyStunToEnemy) {
                    enemy[t].stunned = true;
                    if(!isSilent) logger(`🌀 [ソニヤ効果] 敵の ${t} を次ターン「行動不能」にしました！`);
                }
            }
        }
        if (killsToAlly > 0 && turnEnemyTargetNormal) {
            const t = (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) ? 'bow' : turnEnemyTargetNormal;
            if (ally[t]) {
                ally[t].troops = Math.max(0, ally[t].troops - killsToAlly);
                if (applyEnemyStunToAlly) {
                    ally[t].stunned = true;
                    if(!isSilent) logger(`🌀 [ソニヤ効果] 味方の ${t} を次ターン「行動不能」にしました！`);
                }
            }
        }

        if (atkTypeAlly === 'shield') triggerBuffs(ally, allySkillPool, 'after_shield_attack', logger, "味方", isSilent);
        if (atkTypeEnemy === 'shield') triggerBuffs(enemy, enemySkillPool, 'after_shield_attack', logger, "敵", isSilent);

        if (getTotalTroops(ally) === 0 || getTotalTroops(enemy) === 0) break;
    }

    const updateSpearActionBuffs = (army, skillPool, spearAttacked, evenOccurred, target, sideName) => {
        if (spearAttacked) {
            army.activeBuffs = army.activeBuffs.filter(b => { if (b.isSpearActionBuff) return false; return true; });
            if (evenOccurred) {
                skillPool.forEach(skill => {
                    if (skill.timing === 'spear_even_attack_after') {
                        army.activeBuffs.push({ ...skill, isSpearActionBuff: true, attackedTarget: target, remain: 999 });
                        recordHeroSkill(army, skill, logger, isSilent, true);
                    }
                });
            }
        }
    };
    updateSpearActionBuffs(ally, allySkillPool, allySpearAttackedThisTurn, allySpearEvenAttackOccurred, allySpearActualTarget, "味方");
    updateSpearActionBuffs(enemy, enemySkillPool, enemySpearAttackedThisTurn, enemySpearEvenAttackOccurred, enemySpearActualTarget, "敵");

    const processDuration = (army) => {
        const nextBuffs = [];
        army.activeBuffs.forEach(b => {
            if (b.remain > 900 || b.isSpearActionBuff) { nextBuffs.push(b); return; } 
            b.remain -= 1;
            if (b.remain > 0) nextBuffs.push(b);
        });
        army.activeBuffs = nextBuffs;
    };
    processDuration(ally);
    processDuration(enemy);

    if(!isSilent) logger(`[ターン終了] 味方:${getTotalTroops(ally).toLocaleString()} / 敵:${getTotalTroops(enemy).toLocaleString()}`);
    return { newArmyData: { ally, enemy }, newLogs };
};
