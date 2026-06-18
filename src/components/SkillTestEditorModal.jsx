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
        <div className="fixed inset-0 bg-slate-950/75 z-50 flex justify-center items-center p-2 lg:p-4 backdrop-blur-sm animate-fade-in">
            <div className="ice-panel rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-700/20 animate-fade-in">
                <div className="theme-header p-3 flex justify-between items-center shrink-0 border-b border-slate-700/20">
                    <h2 className="font-bold text-lg flex items-center gap-2">⚙️ Skill Editor (英雄スキル)</h2>
                    <div className="flex gap-2">
                        <button onClick={resetToDefault} className="text-xs bg-red-650/15 hover:bg-red-600/40 border border-red-500/30 text-red-400 dark:text-red-400 light:text-red-700 px-3 py-1.5 rounded font-bold transition shadow-sm">Reset</button>
                        <button onClick={() => onSave(tempDB)} className="text-xs bg-emerald-650/15 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 dark:text-emerald-400 light:text-emerald-700 px-4 py-1.5 rounded font-bold transition shadow-[0_0_8px_rgba(16,185,129,0.15)]">Save</button>
                        <button onClick={onClose} className="text-2xl ml-2 hover:opacity-75 leading-none transition px-2">&times;</button>
                    </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    <div className="theme-nested-panel border-l-4 border-blue-500 p-3 rounded-r-lg mb-4 text-xs shrink-0 shadow-sm flex items-center gap-2 animate-fade-in text-blue-400 dark:text-blue-400 light:text-blue-700">
                        <span className="text-base">💡</span>
                        <p className="font-medium leading-relaxed">
                            ここでは各英雄のスキル設定を一時的に変更して、シミュレーションを行うことができます。
                            <span className="font-normal text-slate-500 dark:text-slate-500 light:text-slate-600 block mt-1">※変更した内容は、ページをリロードすると自動的に元の初期値データにリセットされます。</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(tempDB).map(([heroKey, heroData]) => {
                            if (heroKey === 'none') return null;
                            return (
                                <div key={heroKey} className="theme-nested-panel border border-slate-700/10 rounded-lg shadow-sm overflow-hidden flex flex-col">
                                    <div className="theme-tab-container p-2.5 font-bold text-sm border-b border-slate-700/10 flex justify-between items-center">
                                        {heroData.name} <span className="text-[10px] font-mono tracking-wider bg-slate-900/30 px-1.5 rounded theme-text-muted uppercase">{heroData.type}</span>
                                    </div>
                                    <div className="p-2 flex flex-col gap-2 flex-1">
                                        {Object.entries(heroData.skills).map(([level, skills]) => (
                                            skills.map((skill, index) => (
                                                <div key={`${level}-${index}`} className="theme-nested-panel border border-slate-700/5 shadow-sm rounded p-2 text-xs relative">
                                                    <div className="font-bold theme-ally-win-text mb-1 flex items-center justify-between border-b border-slate-700/10 pb-1"><span>スキル {level}</span></div>
                                                    <div className="flex flex-col gap-1 mt-1 font-mono">
                                                        <div className="flex items-center justify-between"><label className="theme-text-muted text-[10px]">名称:</label><input type="text" className="border border-slate-700/20 rounded p-1 theme-input font-bold text-xs w-2/3" value={skill.name} onChange={(e) => handleChange(heroKey, level, index, 'name', e.target.value)} /></div>
                                                        <div className="flex flex-col gap-0.5"><label className="theme-text-muted text-[10px]">種別(計算上の枠):</label><select className="border border-slate-700/20 rounded p-1 theme-input font-bold text-xs w-full" value={skill.category} onChange={(e) => handleChange(heroKey, level, index, 'category', e.target.value)}>{SKILL_CATEGORY_OPTIONS.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between mt-1"><label className="theme-text-muted text-[10px]">対象:</label><select className="border border-slate-700/20 rounded p-1 theme-input font-bold text-xs w-2/3" value={skill.target} onChange={(e) => handleChange(heroKey, level, index, 'target', e.target.value)}>{SKILL_TARGET_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between"><label className="theme-text-muted text-[10px]">条件:</label><select className="border border-slate-700/20 rounded p-1 theme-input font-bold text-xs w-2/3" value={skill.timing} onChange={(e) => handleChange(heroKey, level, index, 'timing', e.target.value)}>{SKILL_TIMING_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between"><label className="theme-text-muted text-[10px]">効果量(%):</label><input type="number" step="0.1" className="border border-slate-700/20 rounded p-1 theme-input font-bold text-xs w-2/3 text-right" value={+(skill.value * 100).toFixed(1)} onChange={(e) => handleChange(heroKey, level, index, 'value', e.target.value)} /></div>
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
