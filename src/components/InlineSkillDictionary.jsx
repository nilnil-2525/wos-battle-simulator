import React from 'react';
import styles from './InlineSkillDictionary.module.css';

export const InlineSkillDictionary = ({ heroDB }) => {
    const attackCategories = { "DamageUp1": [], "DamageUp2": [], "DamageUp3": [], "NormalDamageUp": [], "ExtraDamageUp": [], "OppDefenseDown1": [], "OppDefenseDown2": [] };
    const defenseCategories = { "DefenseUp1": [], "DefenseUp2": [], "DefenseUp3": [], "DefenseUpS": [], "OppDamageDown1": [], "OppDamageDown2": [] };

    Object.entries(heroDB).forEach(([heroKey, heroData]) => {
        if (heroKey === 'none') return;
        Object.entries(heroData.skills).forEach(([level, skills]) => {
            skills.forEach(skill => {
                const skillInfo = { heroName: heroData.name, level: `スキル${level}`, name: skill.name, valStr: `${(skill.value * 100).toFixed(1)}%`, timing: skill.timing.includes('always') ? '永続' : skill.timing.replace('_instant', ' (即時)').replace('_after', ' (後付与)'), target: skill.target };
                const atkKey = Object.keys(attackCategories).find(k => k === skill.category); if (atkKey) attackCategories[atkKey].push(skillInfo);
                const defKey = Object.keys(defenseCategories).find(k => k === skill.category); if (defKey) defenseCategories[defKey].push(skillInfo);
            });
        });
    });

    const renderSkillList = (categories) => {
        return Object.entries(categories).map(([catName, skills]) => {
            if (skills.length === 0) return null;
            return (
                <div key={catName} className={styles.categoryCard}>
                    <div className={styles.categoryHeader}>🏷️ {catName}</div>
                    <div className={styles.categoryBody}>
                        {skills.map((s, i) => (
                            <div key={i} className={styles.skillItem}>
                                <span className={styles.skillItemHeroName}>
                                    {s.heroName} <span className={styles.skillItemLevel}>{s.level}</span>：
                                </span>
                                <span className={styles.skillItemValue}>{s.name}{s.valStr}</span>
                                <span className={styles.skillItemMeta}>(対:{s.target}/条:{s.timing})</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className={styles.dictContainer}>
            <h2 className={styles.dictTitle}>
                📚 スキル重複カテゴリー辞典 <span className={styles.dictTitleBadge}>※同枠は【加算】、別枠は【乗算】</span>
            </h2>
            <div className={styles.dictGrid}>
                <div>
                    <h3 className={styles.sectionTitleAtk}>⚔️ 味方の攻撃時に計算されるスキル (分子側)</h3>
                    <div className={styles.skillList}>
                        {renderSkillList(attackCategories)}
                    </div>
                </div>
                <div>
                    <h3 className={styles.sectionTitleDef}>🛡️ 敵の攻撃を受ける時に計算されるスキル (分母側)</h3>
                    <div className={styles.skillList}>
                        {renderSkillList(defenseCategories)}
                    </div>
                </div>
            </div>
        </div>
    );
};
