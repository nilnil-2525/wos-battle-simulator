import React, { useState } from 'react';

export const InlineSkillDictionary = ({ heroDB, onClose }) => {
    const [sortBy, setSortBy] = useState('default'); // 'default' | 'value' | 'timing'
    
    const attackCategories = { "DamageUp1": [], "DamageUp2": [], "DamageUp3": [], "NormalDamageUp": [], "ExtraDamageUp": [], "OppDefenseDown1": [], "OppDefenseDown2": [] };
    const defenseCategories = { "DefenseUp1": [], "DefenseUp2": [], "DefenseUp3": [], "DefenseUpS": [], "OppDamageDown1": [], "OppDamageDown2": [] };

    Object.entries(heroDB).forEach(([heroKey, heroData]) => {
        if (heroKey === 'none') return;
        Object.entries(heroData.skills).forEach(([level, skills]) => {
            skills.forEach(skill => {
                const skillInfo = { heroName: heroData.name, level: `ス${level}`, name: skill.name, valStr: `${(skill.value * 100).toFixed(1)}%`, timing: skill.timing.includes('always') ? '永続' : skill.timing.replace('_instant', '即時').replace('_after', '後付与'), target: skill.target };
                const atkKey = Object.keys(attackCategories).find(k => k === skill.category); if (atkKey) attackCategories[atkKey].push(skillInfo);
                const defKey = Object.keys(defenseCategories).find(k => k === skill.category); if (defKey) defenseCategories[defKey].push(skillInfo);
            });
        });
    });

    const sortSkills = (skills) => {
        const sorted = [...skills];
        if (sortBy === 'value') {
            // 効果量（%）の数値が大きい順
            sorted.sort((a, b) => {
                const valA = parseFloat(a.valStr);
                const valB = parseFloat(b.valStr);
                return valB - valA;
            });
        } else if (sortBy === 'timing') {
            // 条件順（永続を最優先）
            sorted.sort((a, b) => {
                if (a.timing === '永続' && b.timing !== '永続') return -1;
                if (a.timing !== '永続' && b.timing === '永続') return 1;
                return a.timing.localeCompare(b.timing);
            });
        } else {
            // デフォルト：英雄名順
            sorted.sort((a, b) => a.heroName.localeCompare(b.heroName));
        }
        return sorted;
    };

    return (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex justify-center items-center p-2 lg:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="ice-panel rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-700/20" onClick={e => e.stopPropagation()}>
                
                {/* ヘッダー＆ソートコントローラー */}
                <div className="theme-header p-3.5 flex flex-col sm:flex-row justify-between items-center shrink-0 border-b border-slate-700/20 gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h2 className="font-bold text-sm lg:text-base flex items-center gap-2">
                            📚 Skill List (重複カテゴリー)
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                        <span className="theme-text-muted text-[10px]">並び替え:</span>
                        <div className="flex theme-tab-container p-0.5 rounded text-[10px] shadow-inner">
                            <button onClick={() => setSortBy('default')} className={`px-2 py-0.5 rounded transition ${sortBy === 'default' ? 'theme-tab-btn-active font-bold' : 'theme-tab-btn-inactive'}`}>👤 英雄順</button>
                            <button onClick={() => setSortBy('value')} className={`px-2 py-0.5 rounded transition ${sortBy === 'value' ? 'theme-tab-btn-active font-bold' : 'theme-tab-btn-inactive'}`}>📊 効果値順</button>
                            <button onClick={() => setSortBy('timing')} className={`px-2 py-0.5 rounded transition ${sortBy === 'timing' ? 'theme-tab-btn-active font-bold' : 'theme-tab-btn-inactive'}`}>⏱️ 条件順</button>
                        </div>
                        <button onClick={onClose} className="text-2xl hover:opacity-75 leading-none transition px-2 ml-2">&times;</button>
                    </div>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="theme-nested-panel border-l-4 border-amber-500 p-3 rounded-r-lg mb-4 text-xs shrink-0 shadow-sm flex items-center gap-2 animate-fade-in text-amber-500 dark:text-amber-400 light:text-amber-700">
                        <span className="text-base">💡</span>
                        <p className="font-medium leading-relaxed">
                            ここでは各スキルの計算枠（カテゴリー）と効果量・発動条件を一覧で確認できます。
                            <span className="font-normal text-slate-500 dark:text-slate-500 light:text-slate-600 block mt-1">※同一カテゴリー内の効果は【加算】、異なるカテゴリー同士の効果は【乗算】として戦闘計算に適用されます。</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-black text-xs border-l-4 border-sky-500 pl-2 mb-3 theme-nested-panel py-1.5 rounded-r">⚔️ 味方の攻撃時に計算されるスキル (分子側)</h3>
                            <div className="flex flex-col gap-2">
                                {Object.entries(attackCategories).map(([catName, skills]) => {
                                    if (skills.length === 0) return null;
                                    return (
                                        <div key={catName} className="theme-nested-panel rounded overflow-hidden shadow-sm">
                                            <div className="theme-tab-container font-bold text-[10px] p-1.5 border-b border-slate-700/10">🏷️ {catName}</div>
                                            <div className="p-2 flex flex-col gap-1">
                                                {sortSkills(skills).map((s, i) => (
                                                    <div key={i} className="grid grid-cols-12 gap-1 text-[10px] py-1 border-b border-slate-700/10 last:border-0 font-mono items-center">
                                                        <span className="col-span-3 font-bold truncate">{s.heroName} <span className="theme-text-muted text-[8px] font-normal">{s.level}</span></span>
                                                        <span className="col-span-3 truncate theme-text-muted">{s.name}</span>
                                                        <span className="col-span-2 font-bold text-right theme-ally-win-text">{s.valStr}</span>
                                                        <span className="col-span-4 theme-text-muted text-[9px] truncate text-right">(対:{s.target}/{s.timing})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-xs border-l-4 border-red-500 pl-2 mb-3 theme-nested-panel py-1.5 rounded-r">🛡️ 敵の攻撃を受ける時に計算されるスキル (分母側)</h3>
                            <div className="flex flex-col gap-2">
                                {Object.entries(defenseCategories).map(([catName, skills]) => {
                                    if (skills.length === 0) return null;
                                    return (
                                        <div key={catName} className="theme-nested-panel rounded overflow-hidden shadow-sm">
                                            <div className="theme-tab-container font-bold text-[10px] p-1.5 border-b border-slate-700/10">🏷️ {catName}</div>
                                            <div className="p-2 flex flex-col gap-1">
                                                {sortSkills(skills).map((s, i) => (
                                                    <div key={i} className="grid grid-cols-12 gap-1 text-[10px] py-1 border-b border-slate-700/10 last:border-0 font-mono items-center">
                                                        <span className="col-span-3 font-bold truncate">{s.heroName} <span className="theme-text-muted text-[8px] font-normal">{s.level}</span></span>
                                                        <span className="col-span-3 truncate theme-text-muted">{s.name}</span>
                                                        <span className="col-span-2 font-bold text-right theme-enemy-win-text">{s.valStr}</span>
                                                        <span className="col-span-4 theme-text-muted text-[9px] truncate text-right">(対:{s.target}/{s.timing})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
