import React from 'react';

export const InlineSkillDictionary = ({ heroDB, onClose }) => {
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

    return (
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex justify-center items-center p-2 lg:p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="ice-panel rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-700/20" onClick={e => e.stopPropagation()}>
                <div className="theme-header p-3.5 flex justify-between items-center shrink-0 border-b border-slate-700/20">
                    <h2 className="font-bold text-sm lg:text-base flex items-center gap-2">
                        📚 スキル重複カテゴリー辞典
                        <span className="text-[9px] lg:text-[10px] theme-nested-panel px-2 py-0.5 rounded font-normal">※同枠は【加算】、別枠は【乗算】</span>
                    </h2>
                    <button onClick={onClose} className="text-2xl hover:opacity-75 leading-none transition px-2">&times;</button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-black text-xs border-l-4 border-sky-500 pl-2 mb-3 theme-nested-panel py-1.5 rounded-r">⚔️ 味方の攻撃時に計算されるスキル (分子側)</h3>
                            <div className="flex flex-col gap-2">
                                {Object.entries(attackCategories).map(([catName, skills]) => {
                                    if (skills.length === 0) return null;
                                    return (
                                        <div key={catName} className="theme-nested-panel rounded overflow-hidden shadow-sm">
                                            <div className="theme-tab-container font-bold text-[10px] p-1.5 border-b border-slate-700/10">🏷️ {catName}</div>
                                            <div className="p-2 flex flex-col gap-1.5">
                                                {skills.map((s, i) => (
                                                    <div key={i} className="text-[10px] pb-1 border-b border-slate-700/10 last:border-0 last:pb-0">
                                                        <span className="font-bold">{s.heroName} <span className="theme-text-muted text-[8px]">{s.level}</span>：</span>
                                                        <span className="theme-ally-win-text font-bold">{s.name}{s.valStr}</span>
                                                        <span className="theme-text-muted text-[9px] ml-1.5">(対:{s.target} / 条件:{s.timing})</span>
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
                                            <div className="p-2 flex flex-col gap-1.5">
                                                {skills.map((s, i) => (
                                                    <div key={i} className="text-[10px] pb-1 border-b border-slate-700/10 last:border-0 last:pb-0">
                                                        <span className="font-bold">{s.heroName} <span className="theme-text-muted text-[8px]">{s.level}</span>：</span>
                                                        <span className="theme-enemy-win-text font-bold">{s.name}{s.valStr}</span>
                                                        <span className="theme-text-muted text-[9px] ml-1.5">(対:{s.target} / 条件:{s.timing})</span>
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
