import React, { useState } from 'react';
import { SKILL_CATEGORY_OPTIONS, SKILL_TARGET_OPTIONS, SKILL_TIMING_OPTIONS } from '../utils/battleSimulator.js';
import styles from './SkillTestEditorModal.module.css';

export const SkillTestEditorModal = ({ currentDB, initialHeroDB, onSave, onClose }) => {
    const [tempDB, setTempDB] = useState(JSON.parse(JSON.stringify(currentDB)));

    const handleChange = (heroKey, level, skillIndex, field, val) => {
        const newData = { ...tempDB };
        const skill = newData[heroKey].skills[level][skillIndex];
        if (field === 'value') {
            skill.value = Number(val) / 100;
        } else {
            skill[field] = val;
        }
        setTempDB(newData);
    };

    const resetToDefault = () => {
        if (confirm("初期状態(最大レベル状態)にリセットしますか？")) {
            setTempDB(JSON.parse(JSON.stringify(initialHeroDB)));
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>⚙️ 英雄スキル・完全エディタ</h2>
                    <div className={styles.headerActions}>
                        <button onClick={resetToDefault} className={styles.btnReset}>初期化</button>
                        <button onClick={() => onSave(tempDB)} className={styles.btnSave}>保存して適用</button>
                        <button onClick={onClose} className={styles.btnClose}>&times;</button>
                    </div>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.editorGrid}>
                        {Object.entries(tempDB).map(([heroKey, heroData]) => {
                            if (heroKey === 'none') return null;
                            return (
                                <div key={heroKey} className={styles.heroCard}>
                                    <div className={styles.heroCardHeader}>
                                        {heroData.name} <span className={styles.heroCardTypeBadge}>{heroData.type}</span>
                                    </div>
                                    <div className={styles.heroCardBody}>
                                        {Object.entries(heroData.skills).map(([level, skills]) => (
                                            skills.map((skill, index) => (
                                                <div key={`${level}-${index}`} className={styles.skillItemCard}>
                                                    <div className={styles.skillItemHeader}><span>スキル {level}</span></div>
                                                    <div className={styles.skillItemForm}>
                                                        <div className={styles.formRow}><label className={styles.formLabel}>名称:</label><input type="text" className={styles.inputField} value={skill.name} onChange={(e) => handleChange(heroKey, level, index, 'name', e.target.value)} /></div>
                                                        <div className={styles.formRowCol}><label className={styles.formLabel}>種別(計算上の枠):</label><select className={styles.selectFieldFull} value={skill.category} onChange={(e) => handleChange(heroKey, level, index, 'category', e.target.value)}>{SKILL_CATEGORY_OPTIONS.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}</select></div>
                                                        <div className={styles.formRowMargin}><label className={styles.formLabel}>対象:</label><select className={styles.selectField} value={skill.target} onChange={(e) => handleChange(heroKey, level, index, 'target', e.target.value)}>{SKILL_TARGET_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className={styles.formRow}><label className={styles.formLabel}>条件:</label><select className={styles.selectField} value={skill.timing} onChange={(e) => handleChange(heroKey, level, index, 'timing', e.target.value)}>{SKILL_TIMING_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className={styles.formRow}><label className={styles.formLabel}>効果量(%):</label><input type="number" step="0.1" className={styles.inputNumberField} value={+(skill.value * 100).toFixed(1)} onChange={(e) => handleChange(heroKey, level, index, 'value', e.target.value)} /></div>
                                                    </div>
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
