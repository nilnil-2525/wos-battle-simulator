import React, { useState } from 'react';
import { SKILL_CATEGORY_OPTIONS, SKILL_TARGET_OPTIONS, SKILL_TIMING_OPTIONS } from '../utils/battleSimulator.js';

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
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex justify-center items-center p-2 lg:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                <div className="bg-slate-800 p-3 flex justify-between items-center text-white shrink-0">
                    <h2 className="font-bold text-lg flex items-center gap-2">⚙️ 英雄スキル・完全エディタ</h2>
                    <div className="flex gap-2">
                        <button onClick={resetToDefault} className="text-xs bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded font-bold transition">初期化</button>
                        <button onClick={() => onSave(tempDB)} className="text-xs bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 rounded font-bold transition shadow-[0_0_10px_rgba(16,185,129,0.5)]">保存して適用</button>
                        <button onClick={onClose} className="text-2xl ml-2 hover:text-slate-300 leading-none">&times;</button>
                    </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(tempDB).map(([heroKey, heroData]) => {
                            if (heroKey === 'none') return null;
                            return (
                                <div key={heroKey} className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-slate-200 p-2 font-bold text-slate-800 text-sm border-b border-slate-300 flex justify-between items-center">
                                        {heroData.name} <span className="text-[10px] font-normal bg-slate-300 px-1.5 rounded text-slate-600">{heroData.type}</span>
                                    </div>
                                    <div className="p-2 flex flex-col gap-2 bg-slate-50 flex-1">
                                        {Object.entries(heroData.skills).map(([level, skills]) => (
                                            skills.map((skill, index) => (
                                                <div key={`${level}-${index}`} className="bg-white border shadow-sm rounded p-2 text-xs relative">
                                                    <div className="font-bold text-indigo-700 mb-1 flex items-center justify-between border-b pb-1"><span>スキル {level}</span></div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="flex items-center justify-between"><label className="text-slate-500 text-[10px]">名称:</label><input type="text" className="border p-1 rounded w-2/3" value={skill.name} onChange={(e) => handleChange(heroKey, level, index, 'name', e.target.value)} /></div>
                                                        <div className="flex flex-col gap-0.5"><label className="text-slate-500 text-[10px]">種別(計算上の枠):</label><select className="border p-1 rounded bg-slate-100 w-full text-[10px] font-bold text-indigo-800" value={skill.category} onChange={(e) => handleChange(heroKey, level, index, 'category', e.target.value)}>{SKILL_CATEGORY_OPTIONS.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between mt-1"><label className="text-slate-500 text-[10px]">対象:</label><select className="border p-1 rounded bg-white w-2/3 text-[10px]" value={skill.target} onChange={(e) => handleChange(heroKey, level, index, 'target', e.target.value)}>{SKILL_TARGET_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between"><label className="text-slate-500 text-[10px]">条件:</label><select className="border p-1 rounded bg-white w-2/3 text-[10px]" value={skill.timing} onChange={(e) => handleChange(heroKey, level, index, 'timing', e.target.value)}>{SKILL_TIMING_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between"><label className="text-slate-500 text-[10px]">効果量(%):</label><input type="number" step="0.1" className="border p-1 rounded w-2/3 text-right bg-blue-50 font-bold" value={+(skill.value * 100).toFixed(1)} onChange={(e) => handleChange(heroKey, level, index, 'value', e.target.value)} /></div>
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
