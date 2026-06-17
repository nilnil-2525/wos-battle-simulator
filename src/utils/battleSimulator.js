// Whiteout Survival (WOS) Battle Simulator - Core Calculation Logic
// This file is React-independent and contains pure calculation functions.

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
    { val: 'mia_atk_prob_50', label: 'ミア：各部隊攻撃時50%(2T~)' }, { val: 'mia_atk_prob_50_ex', label: 'ミア：各部隊攻撃時50%' }, { val: 'mia_turn_prob_40', label: 'ミア：ターン開始時40%' }
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
            if (b.target === 'all_enemy' || b.target === `enemy_${unitType}`) match = true;
            if ((b.target === 'spear_target' || b.target === 'enemy_target') && b.attackedTarget === unitType) match = true;
            if (b.target === 'spear_target' && b.attackedTarget === enemyTargetType) match = true;
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

export const calculateDamageSplit = (atkType, defType, atkArmy, defArmy, minTotalTroops, logger, currentTurn, isEvenAttack, atkSkillPool, isOverallHendrickAttacking = false, isSilent = false, resolvedMiaOppDefDown = 0) => {
    const atkUnit = atkArmy[atkType];
    const defUnit = defArmy[defType];
    const atkBase = baseStatsData[atkType][atkUnit.tier];
    const defBase = baseStatsData[defType][defUnit.tier];

    let hpDiv = 1.0;
    if (defArmy.heroes.leaderBow === 'bradley') {
        if (defType === 'shield') hpDiv = 1.25;
        if (defType === 'spear') hpDiv = 1.30;
    }
    let t11BowPassiveAtkMult = (atkType === 'bow' && atkUnit.tier === 11) ? 1.06 : 1.0;
    let t11ShieldPassiveDefMult = (defType === 'shield' && defUnit.tier === 11) ? 1.06 : 1.0;

    const aAtk = atkBase.attack * (1 + atkUnit.buffs.attack / 100) * t11BowPassiveAtkMult;
    const aLet = atkBase.lethality * (1 + atkUnit.buffs.lethality / 100);
    const dDef = defBase.defense * (1 + defUnit.buffs.defense / 100) * t11ShieldPassiveDefMult;
    const dHp = (defBase.hp * (1 + defUnit.buffs.hp / 100)) / hpDiv;

    const myBuffs = atkArmy.activeBuffs;
    const enemyBuffs = defArmy.activeBuffs;

    let miaOppDefDown = resolvedMiaOppDefDown;
    let miaExtraDmg = 0;
    if (!isOverallHendrickAttacking) {
        const miaSkill2s = atkSkillPool.filter(s => s.timing === 'mia_atk_prob_50_ex');
        if (miaSkill2s.length > 0 && Math.random() < 0.50) {
            miaSkill2s.forEach(s => {
                miaExtraDmg += s.value;
                recordHeroSkill(atkArmy, s, logger, isSilent, true);
            });
        }
    }

    const dmgUp1 = sumBuffCategory(myBuffs, 'DamageUp1', atkType, null, true);
    const dmgUp2 = sumBuffCategory(myBuffs, 'DamageUp2', atkType, null, true);
    const dmgUp3 = sumBuffCategory(myBuffs, 'DamageUp3', atkType, null, true);
    const normalDmgUp = sumBuffCategory(myBuffs, 'NormalDamageUp', atkType, null, true);
    const oppDefDown1 = sumBuffCategory(myBuffs, 'OppDefenseDown1', atkType, defType, false) + miaOppDefDown;
    const oppDefDown2 = sumBuffCategory(myBuffs, 'OppDefenseDown2', atkType, defType, false);
    const defUp1 = sumBuffCategory(enemyBuffs, 'DefenseUp1', defType, null, true);
    const defUp2 = sumBuffCategory(enemyBuffs, 'DefenseUp2', defType, null, true);
    let defUp3 = sumBuffCategory(enemyBuffs, 'DefenseUp3', defType, null, true);
    const defUpS = sumBuffCategory(enemyBuffs, 'DefenseUpS', defType, null, true);
    const oppDmgDown1 = sumBuffCategory(enemyBuffs, 'OppDamageDown1', atkType, defType, false);
    const oppDmgDown2 = sumBuffCategory(enemyBuffs, 'OppDamageDown2', atkType, defType, false);

    const normalNumerator = (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + normalDmgUp) * (1 + oppDefDown1) * (1 + oppDefDown2);
    const commonDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + defUp3) * (1 + defUpS);
    const normalSkillMod = normalNumerator / commonDenominator;

    let exDmgUp = sumBuffCategory(myBuffs, 'ExtraDamageUp', atkType, null, true) + miaExtraDmg;
    let instantLog = "";
    let hasStunApplied = false;
    
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

    atkSkillPool.forEach(skill => {
        if (atkType === 'spear' && isEvenAttack && skill.timing === 'spear_even_attack_instant') { 
            exDmgUp += skill.value;
            instantLog += `[${skill.heroName}+${(skill.value*100).toFixed(1)}%] `; 
            recordHeroSkill(atkArmy, skill, logger, isSilent, false);
        }
        if (atkType === 'spear' && (currentTurn - (atkArmy.stunTurnOffset||0)) % 5 === 0 && (currentTurn - (atkArmy.stunTurnOffset||0)) > 0 && skill.timing === 'turn_5n_instant') { 
            exDmgUp += skill.value;
            instantLog += `[${skill.heroName}Ⅲ+${(skill.value*100).toFixed(1)}%] `; 
            hasStunApplied = true; 
            recordHeroSkill(atkArmy, skill, logger, isSilent, false);
        }
    });

    if (isOverallHendrickAttacking) exDmgUp = 0.40;
    else exDmgUp += t11BowExtraAtk;

    let exDefUp3 = defUp3;
    if (enemyBuffs.some(b => b.heroName === '無名' && defType === 'shield') && exDmgUp > 0) exDefUp3 = defUp3 - 0.25 + 0.30;

    const exDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + exDefUp3) * (1 + defUpS);
    const exNumerator = exDmgUp * (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + oppDefDown1) * (1 + oppDefDown2);
    const exSkillMod = exNumerator / exDenominator;

    let multiplier = 1.0;
    let t7Reduc = 1.0;
    if ((atkType === 'shield' && defType === 'spear') || (atkType === 'spear' && defType === 'bow') || (atkType === 'bow' && defType === 'shield')) multiplier = 1.1;
    if (atkType === 'spear' && defType === 'shield' && defUnit.tier >= 7) t7Reduc = 1.1;

    const baseDmg = (aAtk * aLet) / (Math.max(1, dDef) * Math.max(1, dHp)) / 100;
    let rawNormal = isOverallHendrickAttacking ? 0 : (baseDmg * Math.sqrt(atkUnit.troops) * Math.sqrt(minTotalTroops) * multiplier * normalSkillMod / t7Reduc);
    let rawExtra = exDmgUp > 0 ? (baseDmg * Math.sqrt(atkUnit.troops) * Math.sqrt(minTotalTroops) * multiplier * exSkillMod / t7Reduc) : 0;

    let t11SpearDmgMult = 1.0;
    if (atkType === 'spear' && atkUnit.tier === 11 && !isOverallHendrickAttacking) {
        if (Math.random() < 0.15) {
            t11SpearDmgMult = 2.0;
            atkArmy.stats.enshoCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【炎晶戦矛】発動！`);
        }
    }

    let t11ShieldReceiveDiv = 1.0;
    if (defType === 'shield' && defUnit.tier === 11) {
        if (Math.random() < 0.375) {
            t11ShieldReceiveDiv = 1.51;
            defArmy.stats.resshoCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 盾兵【烈晶盾】発動！`);
        }
    }

    let t11SpearReceiveDiv = 1.0;
    if (defType === 'spear' && defUnit.tier === 11) {
        if (Math.random() < 0.15) {
            t11SpearReceiveDiv = 2.0;
            defArmy.stats.shiretsuCount++;
            if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【熾烈領域】発動！`);
        }
    }

    const finalNormalKills = rawNormal * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
    const finalExtraKills = rawExtra * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
    const totalKills = Math.round(finalNormalKills + finalExtraKills);

    if (renshaActive) atkArmy.stats.renshaKills += Math.round(finalExtraKills * (1.00 / exDmgUp));
    if (nenshoActive) atkArmy.stats.nenshoKills += Math.round(finalExtraKills * (0.875 / exDmgUp));

    let detailLog = "";
    if (!isSilent) {
        const formatMult = (...vals) => {
            const factors = vals.filter(v => v !== 0).map(v => (1 + v).toFixed(2));
            return factors.length > 0 ? factors.join(' × ') : '1.00';
        };
        const dmgUpStr = formatMult(dmgUp1, dmgUp2, dmgUp3, normalDmgUp);
        const oppDefDownStr = formatMult(oppDefDown1, oppDefDown2);
        const oppDmgDownStr = formatMult(oppDmgDown1, oppDmgDown2);
        const defUpStr = formatMult(defUp1, defUp2, defUp3, defUpS);
        const exDefUpStr = formatMult(defUp1, defUp2, exDefUp3, defUpS);

        detailLog += `  ┣ [計算内訳]:\n`;
        if (instantLog !== "") detailLog += `  ┃ ⚡即時追加: ${instantLog}\n`;
        if (!isOverallHendrickAttacking) {
            detailLog += `  ┃ [通常Mod]: (${dmgUpStr} [与ダバフ] × ${oppDefDownStr} [被ダ増]) / (${oppDmgDownStr} [攻撃低下] × ${defUpStr} [被ダ低下]) = ${normalSkillMod.toFixed(3)}\n`;
        }
        if (exDmgUp > 0) {
            const exDmgUpStr = formatMult(dmgUp1, dmgUp2, dmgUp3);
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

    const allyMiaSkill3s = allySkillPool.filter(s => s.timing === 'mia_turn_prob_40');
    if (allyMiaSkill3s.length > 0 && Math.random() < 0.40) {
        allyMiaSkill3s.forEach(s => {
            ally.activeBuffs.push({ ...s, remain: 1 });
            recordHeroSkill(ally, s, logger, isSilent, true);
        });
    }
    const enemyMiaSkill3s = enemySkillPool.filter(s => s.timing === 'mia_turn_prob_40');
    if (enemyMiaSkill3s.length > 0 && Math.random() < 0.40) {
        enemyMiaSkill3s.forEach(s => {
            enemy.activeBuffs.push({ ...s, remain: 1 });
            recordHeroSkill(enemy, s, logger, isSilent, true);
        });
    }

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

        let allyResolvedMiaOppDefDown = 0;
        if (currentTurn >= 2 && atkTypeAlly) {
            const miaSkill1s = allySkillPool.filter(s => s.timing === 'mia_atk_prob_50');
            if (miaSkill1s.length > 0 && Math.random() < 0.50) {
                miaSkill1s.forEach(s => {
                    allyResolvedMiaOppDefDown += s.value;
                    recordHeroSkill(ally, s, logger, isSilent, true);
                });
            }
        }
        let enemyResolvedMiaOppDefDown = 0;
        if (currentTurn >= 2 && atkTypeEnemy) {
            const miaSkill1sE = enemySkillPool.filter(s => s.timing === 'mia_atk_prob_50');
            if (miaSkill1sE.length > 0 && Math.random() < 0.50) {
                miaSkill1sE.forEach(s => {
                    enemyResolvedMiaOppDefDown += s.value;
                    recordHeroSkill(enemy, s, logger, isSilent, true);
                });
            }
        }

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
                
                if (atkTypeAlly === 'bow' && (currentTurn - (ally.stunTurnOffset||0)) % 3 === 0 && (currentTurn - (ally.stunTurnOffset||0)) > 0 && allySkillPool.some(s => s.category === 'Hendrick3')) {
                    const hendrickSkills = allySkillPool.filter(s => s.category === 'Hendrick3');
                    if(hendrickSkills.length > 0) {
                        recordHeroSkill(ally, hendrickSkills[0], logger, isSilent, true);
                        ['shield', 'spear', 'bow'].forEach(oppType => {
                            if (enemy[oppType].troops > 0) {
                                const hResult = calculateDamageSplit('bow', oppType, ally, enemy, fixedMinTroopsSetting, logger, currentTurn, false, allySkillPool, true, isSilent, allyResolvedMiaOppDefDown);
                                enemy[oppType].troops = Math.max(0, enemy[oppType].troops - hResult.totalKills);
                                if(!isSilent) {
                                    logger(`  ▶ [味方 bow] ➔ [敵 ${oppType}] へ追加狙撃`);
                                    if (hResult.detailLog) logger(hResult.detailLog);
                                    logger(`     💥 追加撃破: ${hResult.totalKills.toLocaleString()}人`);
                                }
                            }
                        });
                    }
                }
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
                
                if (atkTypeEnemy === 'bow' && (currentTurn - (enemy.stunTurnOffset||0)) % 3 === 0 && (currentTurn - (enemy.stunTurnOffset||0)) > 0 && enemySkillPool.some(s => s.category === 'Hendrick3')) {
                    const hendrickSkills = enemySkillPool.filter(s => s.category === 'Hendrick3');
                    if(hendrickSkills.length > 0) {
                        recordHeroSkill(enemy, hendrickSkills[0], logger, isSilent, true);
                        ['shield', 'spear', 'bow'].forEach(oppType => {
                            if (ally[oppType].troops > 0) {
                                const hResult = calculateDamageSplit('bow', oppType, enemy, ally, fixedMinTroopsSetting, logger, currentTurn, false, enemySkillPool, true, isSilent, enemyResolvedMiaOppDefDown);
                                ally[oppType].troops = Math.max(0, ally[oppType].troops - hResult.totalKills);
                                if(!isSilent) {
                                    logger(`  ▶ [敵 bow] ➔ [味方 ${oppType}] へ追加狙撃`);
                                    if (hResult.detailLog) logger(hResult.detailLog);
                                    logger(`     💥 追加撃破: ${hResult.totalKills.toLocaleString()}人`);
                                }
                            }
                        });
                    }
                }
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
