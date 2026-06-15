import React from 'react';

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

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-amber-200 mb-4 animate-fade-in max-h-[400px] overflow-y-auto">
            <h2 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2 border-b border-amber-200 pb-2">
                📚 スキル重複カテゴリー辞典 <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-700 font-normal">※同枠は【加算】、別枠は【乗算】</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-black text-red-600 text-xs border-l-4 border-red-500 pl-2 mb-2 bg-red-50 py-1">⚔️ 味方の攻撃時に計算されるスキル (分子側)</h3>
                    <div className="flex flex-col gap-2">
                        {Object.entries(attackCategories).map(([catName, skills]) => {
                            if (skills.length === 0) return null;
                            return (
                                <div key={catName} className="border border-slate-200 rounded bg-white overflow-hidden shadow-sm">
                                    <div className="bg-slate-100 font-bold text-[10px] p-1.5 text-slate-700 border-b border-slate-200">🏷️ {catName}</div>
                                    <div className="p-1.5">{skills.map((s, i) => (<div key={i} className="text-[10px] mb-1 pb-1 border-b border-slate-50 last:border-0 last:mb-0 last:pb-0"><span className="font-bold text-slate-800">{s.heroName} <span className="text-slate-400 text-[8px]">{s.level}</span>：</span><span className="text-indigo-600 font-bold">{s.name}{s.valStr}</span><span className="text-slate-400 text-[9px] ml-1">(対:{s.target}/条:{s.timing})</span></div>))}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="font-black text-blue-600 text-xs border-l-4 border-blue-500 pl-2 mb-2 bg-blue-50 py-1">🛡️ 敵の攻撃を受ける時に計算されるスキル (分母側)</h3>
                    <div className="flex flex-col gap-2">
                        {Object.entries(defenseCategories).map(([catName, skills]) => {
                            if (skills.length === 0) return null;
                            return (
                                <div key={catName} className="border border-slate-200 rounded bg-white overflow-hidden shadow-sm">
                                    <div className="bg-slate-100 font-bold text-[10px] p-1.5 text-slate-700 border-b border-slate-200">🏷️ {catName}</div>
                                    <div className="p-1.5">{skills.map((s, i) => (<div key={i} className="text-[10px] mb-1 pb-1 border-b border-slate-50 last:border-0 last:mb-0 last:pb-0"><span className="font-bold text-slate-800">{s.heroName} <span className="text-slate-400 text-[8px]">{s.level}</span>：</span><span className="text-indigo-600 font-bold">{s.name}{s.valStr}</span><span className="text-slate-400 text-[9px] ml-1">(対:{s.target}/条:{s.timing})</span></div>))}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
