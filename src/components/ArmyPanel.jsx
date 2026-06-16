import React from 'react';
import { baseStatsData } from '../utils/battleSimulator.js';
import styles from './ArmyPanel.module.css';

export const HeroSelector = ({ side, role, label, allowedType, value, onChange, disabled, heroDB }) => (
    <div className={styles.heroSelectorContainer}>
        <span className={styles.heroSelectorLabel}>{label}</span>
        <select className={styles.heroSelectorSelect} value={value} onChange={e => onChange(side, role, e.target.value)} disabled={disabled}>
            {Object.entries(heroDB).map(([key, hero]) => {
                if (allowedType && hero.type !== allowedType && hero.type !== 'none') return null;
                return <option key={key} value={key}>{hero.name}</option>;
            })}
        </select>
    </div>
);

export const UnitInput = ({ label, unit, type, side, onChange, disabled, isStunned }) => {
    const base = baseStatsData[type][unit.tier] || { attack: 0, lethality: 0, defense: 0, hp: 0 };
    const fAtk = Math.floor(base.attack * (100 + unit.buffs.attack) / 100);
    const fLet = Math.floor(base.lethality * (100 + unit.buffs.lethality) / 100);
    const fDef = Math.floor(base.defense * (100 + unit.buffs.defense) / 100);
    const fHp = Math.floor(base.hp * (100 + unit.buffs.hp) / 100);

    const inputClass = `${styles.unitInput} ${side === 'ally' ? styles.unitInputAlly : styles.unitInputEnemy}`;
    const titleClass = `${styles.unitTitle} ${side === 'ally' ? styles.unitTitleAlly : styles.unitTitleEnemy}`;
    
    let troopsValClass = styles.troopsValue;
    if (unit.troops === 0) {
        troopsValClass += ` ${styles.troopsValueZero}`;
    } else if (side === 'ally') {
        troopsValClass += ` ${styles.troopsValueAlly}`;
    } else {
        troopsValClass += ` ${styles.troopsValueEnemy}`;
    }

    return (
        <div className={inputClass}>
            {isStunned && <div className={styles.stunBadge}>🌀 スタン中</div>}
            <h4 className={titleClass}>{label}</h4>
            <div className={styles.rowFlex}>
                <label className={styles.labelSmall}>Tier</label>
                <select className={styles.selectSmall} value={unit.tier} onChange={(e) => onChange(side, type, 'tier', Number(e.target.value))} disabled={disabled}>
                    {[1,5,6,8,11].map(t => <option key={t} value={t}>{t === 11 ? "T11 (fc10)" : `T${t}`}</option>)}
                </select>
                <label className={styles.labelSmallMargin}>兵士数</label>
                <input type="number" className={styles.inputNumberSmall} value={unit.initialTroops} onChange={(e) => onChange(side, type, 'initialTroops', Math.max(0, Number(e.target.value)))} disabled={disabled} />
            </div>
            <div className={styles.buffContainer}>
                <h5 className={styles.buffTitle}>ステータスバフ (%)</h5>
                <div className={styles.buffGrid}>
                    <div><label className={styles.buffInputLabel}>攻撃</label><input type="number" value={unit.buffs.attack} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, attack: Number(e.target.value)})} disabled={disabled} className={styles.buffInput} /></div>
                    <div><label className={styles.buffInputLabel}>防御</label><input type="number" value={unit.buffs.defense} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, defense: Number(e.target.value)})} disabled={disabled} className={styles.buffInput} /></div>
                    <div><label className={styles.buffInputLabel}>殺傷</label><input type="number" value={unit.buffs.lethality} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, lethality: Number(e.target.value)})} disabled={disabled} className={styles.buffInput} /></div>
                    <div><label className={styles.buffInputLabel}>HP</label><input type="number" value={unit.buffs.hp} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, hp: Number(e.target.value)})} disabled={disabled} className={styles.buffInput} /></div>
                </div>
            </div>
            <div className={styles.statsFooter}>
                <span>攻:{fAtk}</span><span>防:{fDef}</span><span>殺:{fLet}</span><span>HP:{fHp}</span>
            </div>
            <div className={styles.troopsContainer}>
                <span className={styles.troopsLabel}>残存兵力</span>
                <span className={troopsValClass}>{unit.troops.toLocaleString()}</span>
            </div>
        </div>
    );
};

export const ArmyPanel = ({ side, title, army, bgColor, borderColor, titleColor, turn, onHeroChange, onUnitChange, heroDB }) => (
    <div className={`${styles.armyPanel} ${borderColor}`}>
        <h2 className={`${styles.armyPanelTitle} ${titleColor}`}>{title}<span className={styles.armyPanelTitleTotal}>総兵力: {(army.shield.troops + army.spear.troops + army.bow.troops).toLocaleString()}</span></h2>
        <div className={styles.heroFormationContainer}>
            <h4 className={styles.heroFormationTitle}>👑 英雄編成</h4>
            <div className={styles.heroFormationGrid}>
                <div>
                    <HeroSelector side={side} role="leaderShield" label="盾リーダー" allowedType="shield" value={army.heroes.leaderShield} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                    <HeroSelector side={side} role="leaderSpear" label="槍リーダー" allowedType="spear" value={army.heroes.leaderSpear} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                    <HeroSelector side={side} role="leaderBow" label="弓リーダー" allowedType="bow" value={army.heroes.leaderBow} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                </div>
                <div>
                    <HeroSelector side={side} role="rider1" label="乗り手1" value={army.heroes.rider1} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                    <HeroSelector side={side} role="rider2" label="乗り手2" value={army.heroes.rider2} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                    <HeroSelector side={side} role="rider3" label="乗り手3" value={army.heroes.rider3} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                    <HeroSelector side={side} role="rider4" label="乗り手4" value={army.heroes.rider4} onChange={onHeroChange} disabled={turn > 0} heroDB={heroDB} />
                </div>
            </div>
        </div>
        <UnitInput label="🛡️ 盾兵" unit={army.shield} type="shield" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.shield.stunned} />
        <UnitInput label="🗡️ 槍兵" unit={army.spear} type="spear" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.spear.stunned} />
        <UnitInput label="🏹 弓兵" unit={army.bow} type="bow" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.bow.stunned} />
    </div>
);
