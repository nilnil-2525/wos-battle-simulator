/**
 * 英雄固有の特殊計算・抽選処理をまとめたヘルパーモジュール
 */

/**
 * ターン開始時の英雄スキル特殊処理を適用する (ミアⅢ, グレッグⅠ)
 * @param {object} army - 部隊オブジェクト (ally または enemy)
 * @param {Array} skillPool - スキルプール
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 */
export const handleHeroTurnStartSkills = (army, skillPool, recordHeroSkill, logger, isSilent) => {
    // ミアⅢ（ターン開始時40%バフ）
    const miaSkill3s = skillPool.filter(s => s.timing === 'mia_turn_prob_40');
    if (miaSkill3s.length > 0 && Math.random() < 0.40) {
        miaSkill3s.forEach(s => {
            army.activeBuffs.push({ ...s, remain: 1 });
            recordHeroSkill(army, s, logger, isSilent, true);
        });
    }

    // グレッグⅠ（ターン開始時20%バフ）
    const gregSkill1s = skillPool.filter(s => s.timing === 'greg_turn_prob_20');
    if (gregSkill1s.length > 0 && Math.random() < 0.20) {
        army.activeBuffs = army.activeBuffs.filter(b => !(b.heroKey === 'greg' && b.timing === 'greg_turn_prob_20'));
        const totalValue = gregSkill1s.reduce((sum, s) => sum + s.value, 0);
        const baseSkill = gregSkill1s[0];
        army.activeBuffs.push({
            ...baseSkill,
            value: totalValue,
            remain: baseSkill.duration
        });
        gregSkill1s.forEach(s => recordHeroSkill(army, s, logger, isSilent, true));
    }
};

/**
 * 各フェーズ開始時のミアⅠ (フェーズ開始時50%デバフ) の抽選・適用
 * @param {number} currentTurn - 現在のターン数
 * @param {string} atkType - 攻撃兵種 ('shield', 'spear', 'bow')
 * @param {Array} skillPool - 攻撃側のスキルプール
 * @param {object} army - 攻撃側の部隊オブジェクト
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 * @returns {number} 適用されるミアⅠの被ダメージ上昇値
 */
export const handleHeroPhaseStartDebuffs = (currentTurn, atkType, skillPool, army, recordHeroSkill, logger, isSilent) => {
    let resolvedMiaOppDefDown = 0;
    if (currentTurn >= 2 && atkType) {
        const miaSkill1s = skillPool.filter(s => s.timing === 'mia_atk_prob_50');
        if (miaSkill1s.length > 0 && Math.random() < 0.50) {
            miaSkill1s.forEach(s => {
                resolvedMiaOppDefDown += s.value;
                recordHeroSkill(army, s, logger, isSilent, true);
            });
        }
    }
    return resolvedMiaOppDefDown;
};

/**
 * 各フェーズ開始時のグレッグⅡ (フェーズ開始時20%デバフ) の抽選・適用
 * @param {string} atkType - 攻撃兵種
 * @param {object} army - 攻撃側の部隊オブジェクト
 * @param {object} oppArmy - 防御側の部隊オブジェクト
 * @param {Array} skillPool - 攻撃側のスキルプール
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 */
export const handleHeroPhaseStartBuffs = (atkType, army, oppArmy, skillPool, recordHeroSkill, logger, isSilent) => {
    if (atkType && oppArmy[atkType] && oppArmy[atkType].troops > 0) {
        const gregSkill2s = skillPool.filter(s => s.timing === 'greg_phase_prob_20');
        if (gregSkill2s.length > 0 && Math.random() < 0.20) {
            army.activeBuffs = army.activeBuffs.filter(b => !(
                b.heroKey === 'greg' && 
                b.timing === 'greg_phase_prob_20' && 
                b.target === `enemy_${atkType}`
            ));
            const totalValue = gregSkill2s.reduce((sum, s) => sum + s.value, 0);
            const baseSkill = gregSkill2s[0];
            army.activeBuffs.push({
                ...baseSkill,
                target: `enemy_${atkType}`,
                value: totalValue,
                remain: baseSkill.duration
            });
            gregSkill2s.forEach(s => recordHeroSkill(army, s, logger, isSilent, true));
        }
    }
};

/**
 * 攻撃時のミアⅡ (攻撃時50%追加ダメージ) の抽選・適用
 * @param {boolean} isOverallHendrickAttacking - ヘンドリック追加狙撃中フラグ
 * @param {Array} skillPool - 攻撃側のスキルプール
 * @param {object} army - 攻撃側の部隊オブジェクト
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 * @returns {number} 適用されるミアⅡの追加ダメージ係数
 */
export const handleHeroAttackExtraDamage = (isOverallHendrickAttacking, skillPool, army, recordHeroSkill, logger, isSilent) => {
    let miaExtraDmg = 0;
    if (!isOverallHendrickAttacking) {
        const miaSkill2s = skillPool.filter(s => s.timing === 'mia_atk_prob_50_ex');
        if (miaSkill2s.length > 0 && Math.random() < 0.50) {
            miaSkill2s.forEach(s => {
                miaExtraDmg += s.value;
                recordHeroSkill(army, s, logger, isSilent, true);
            });
        }
    }
    return miaExtraDmg;
};

/**
 * 各種アクティブスキルの即時効果（ソニヤⅢ, ゴードンⅠ）を集計する
 * @param {string} atkType - 攻撃兵種
 * @param {number} currentTurn - 現在のターン数
 * @param {boolean} isEvenAttack - 偶数回攻撃フラグ (槍兵のみ)
 * @param {Array} skillPool - 攻撃側のスキルプール
 * @param {object} army - 攻撃側の部隊オブジェクト
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 * @returns {object} { exDmgUp, instantLog, hasStunApplied }
 */
export const handleHeroInstantAttackSkills = (atkType, currentTurn, isEvenAttack, skillPool, army, recordHeroSkill, logger, isSilent) => {
    let exDmgUp = 0;
    let instantLog = "";
    let hasStunApplied = false;

    skillPool.forEach(skill => {
        if (atkType === 'spear' && isEvenAttack && skill.timing === 'spear_even_attack_instant') { 
            exDmgUp += skill.value;
            instantLog += `[${skill.heroName}+${(skill.value*100).toFixed(1)}%] `; 
            recordHeroSkill(army, skill, logger, isSilent, false);
        }
        if (atkType === 'spear' && (currentTurn - (army.stunTurnOffset||0)) % 5 === 0 && (currentTurn - (army.stunTurnOffset||0)) > 0 && skill.timing === 'turn_5n_instant') { 
            exDmgUp += skill.value;
            instantLog += `[${skill.heroName}Ⅲ+${(skill.value*100).toFixed(1)}%] `; 
            hasStunApplied = true; 
            recordHeroSkill(army, skill, logger, isSilent, false);
        }
    });

    return { exDmgUp, instantLog, hasStunApplied };
};

/**
 * ヘンドリックⅢの3T毎の全体狙撃処理
 * @param {string} atkType - 攻撃兵種
 * @param {number} currentTurn - 現在のターン数
 * @param {Array} skillPool - 攻撃側のスキルプール
 * @param {object} army - 攻撃側の部隊オブジェクト
 * @param {object} oppArmy - 防御側の部隊オブジェクト
 * @param {function} recordHeroSkill - ログ記録関数
 * @param {function} calculateDamageSplit - ダメージ計算関数
 * @param {number} fixedMinTroopsSetting - 最少部隊数設定
 * @param {function} logger - ロガー関数
 * @param {boolean} isSilent - ミュートフラグ
 * @param {number} resolvedMiaOppDefDown - ミアのフェーズデバフ適用値
 * @param {string} sideName - 攻撃側の勢力名 ("味方" または "敵")
 * @param {string} oppSideName - 防御側の勢力名 ("敵" または "味方")
 */
export const handleHeroHendrickSnipe = (
    atkType,
    currentTurn,
    skillPool,
    army,
    oppArmy,
    recordHeroSkill,
    calculateDamageSplit,
    fixedMinTroopsSetting,
    logger,
    isSilent,
    resolvedMiaOppDefDown,
    sideName,
    oppSideName
) => {
    const effTurn = currentTurn - (army.stunTurnOffset || 0);
    if (atkType === 'bow' && effTurn % 3 === 0 && effTurn > 0 && skillPool.some(s => s.category === 'Hendrick3')) {
        const hendrickSkills = skillPool.filter(s => s.category === 'Hendrick3');
        if (hendrickSkills.length > 0) {
            recordHeroSkill(army, hendrickSkills[0], logger, isSilent, true);
            ['shield', 'spear', 'bow'].forEach(oppType => {
                if (oppArmy[oppType].troops > 0) {
                    const hResult = calculateDamageSplit(
                        'bow',
                        oppType,
                        army,
                        oppArmy,
                        fixedMinTroopsSetting,
                        logger,
                        currentTurn,
                        false,
                        skillPool,
                        true,
                        isSilent,
                        resolvedMiaOppDefDown
                    );
                    oppArmy[oppType].troops = Math.max(0, oppArmy[oppType].troops - hResult.totalKills);
                    if (!isSilent) {
                        logger(`  ▶ [${sideName} bow] ➔ [${oppSideName} ${oppType}] へ追加狙撃`);
                        if (hResult.detailLog) logger(hResult.detailLog);
                        logger(`     💥 追加撃破: ${hResult.totalKills.toLocaleString()}人`);
                    }
                }
            });
        }
    }
};
