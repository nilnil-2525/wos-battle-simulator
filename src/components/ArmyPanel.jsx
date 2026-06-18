import React, { useState } from 'react';
import { baseStatsData } from '../utils/battleSimulator.js';

export const HeroSelector = ({ side, role, label, allowedType, value, onChange, disabled, heroDB }) => (
    <div className="flex items-center justify-between theme-hero-selector p-1.5 rounded mb-1">
        <span className="text-[11px] font-bold theme-text-muted w-16">{label}</span>
        <select className="flex-1 theme-hero-select-box text-xs p-1 rounded font-bold border border-slate-700/20 outline-none cursor-pointer" value={value} onChange={e => onChange(side, role, e.target.value)} disabled={disabled}>
            {Object.entries(heroDB).map(([key, hero]) => {
                if (allowedType && hero.type !== allowedType && hero.type !== 'none') return null;
                return <option key={key} value={key}>{hero.name}</option>;
            })}
        </select>
    </div>
);

export const UnitInput = ({ 
    label, 
    unit, 
    type, 
    side, 
    onChange, 
    disabled, 
    isStunned,
    unitPresets = { 1: null, 2: null, 3: null, 4: null, 5: null },
    onLoadUnitPreset,
    onSaveUnitPreset
}) => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleSlotClick = (num) => {
        if (isRegisterMode) {
            onSaveUnitPreset(type, num, unit);
            setIsRegisterMode(false);
        } else {
            const preset = unitPresets[num];
            if (preset) {
                onLoadUnitPreset(side, type, preset);
            }
        }
    };

    const base = baseStatsData[type][unit.tier] || { attack: 0, lethality: 0, defense: 0, hp: 0 };
    const fAtk = Math.floor(base.attack * (100 + unit.buffs.attack) / 100);
    const fLet = Math.floor(base.lethality * (100 + unit.buffs.lethality) / 100);
    const fDef = Math.floor(base.defense * (100 + unit.buffs.defense) / 100);
    const fHp = Math.floor(base.hp * (100 + unit.buffs.hp) / 100);

    return (
        <div className={`p-3 mb-3 rounded-xl border relative ${side === 'ally' ? 'theme-unit-panel-ally' : 'theme-unit-panel-enemy'}`}>
            {isStunned && <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow animate-pulse">🌀 スタン中</div>}
            
            <div className="flex justify-between items-center mb-2 border-b border-slate-650/40 pb-1">
                <h4 className={`font-bold text-sm ${side === 'ally' ? 'theme-ally-win-text' : 'theme-enemy-win-text'}`}>{label}</h4>
                <button 
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className={`preset-btn-register ${isRegisterMode ? 'active' : ''}`}
                    disabled={disabled}
                >
                    {isRegisterMode ? 'スロット選択...' : 'Preset 💾'}
                </button>
            </div>

            <div className="w-full mb-3 border-b border-slate-650/20 pb-2">
                <div className="preset-slots-container">
                    {[1, 2, 3, 4, 5].map(num => {
                        const hasData = !!unitPresets[num];
                        return (
                            <div key={num} className="relative flex-1">
                                <button
                                    onClick={() => handleSlotClick(num)}
                                    className={`preset-slot-btn w-full ${
                                        isRegisterMode 
                                            ? 'register-active' 
                                            : hasData 
                                                ? 'has-data' 
                                                : 'empty'
                                    }`}
                                    disabled={disabled}
                                    title={isRegisterMode ? `${num}番に保存` : hasData ? `スロット${num}をロード` : '未登録'}
                                >
                                    {num}
                                </button>
                                {isRegisterMode && hasData && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`スロット${num}のデータを削除しますか？`)) {
                                                onSaveUnitPreset(type, num, null);
                                            }
                                        }}
                                        className="preset-slot-clear-btn"
                                        title="クリア"
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-bold theme-text-muted">Tier</label>
                <select className="border border-slate-700/20 rounded p-0.5 theme-input font-bold text-xs" value={unit.tier} onChange={(e) => onChange(side, type, 'tier', Number(e.target.value))} disabled={disabled}>
                    {[1,5,6,8,11].map(t => <option key={t} value={t}>{t === 11 ? "T11 (fc10)" : `T${t}`}</option>)}
                </select>
                <label className="text-xs font-bold theme-text-muted ml-2">兵士数</label>
                <input type="number" className="flex-1 border border-slate-700/20 rounded p-0.5 theme-input font-bold text-xs" value={unit.initialTroops} onChange={(e) => onChange(side, type, 'initialTroops', Math.max(0, Number(e.target.value)))} disabled={disabled} />
            </div>
            <div className="theme-tab-container p-2 rounded mb-2">
                <h5 className="text-xs font-bold theme-text-muted mb-1">ステータスバフ (%)</h5>
                <div className="grid grid-cols-4 gap-1 text-xs">
                    <div><label className="block text-[10.5px] theme-text-muted text-center">攻撃</label><input type="number" value={unit.buffs.attack} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, attack: Number(e.target.value)})} disabled={disabled} className="w-full text-center theme-input p-0.5 rounded font-bold text-xs" /></div>
                    <div><label className="block text-[10.5px] theme-text-muted text-center">防御</label><input type="number" value={unit.buffs.defense} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, defense: Number(e.target.value)})} disabled={disabled} className="w-full text-center theme-input p-0.5 rounded font-bold text-xs" /></div>
                    <div><label className="block text-[10.5px] theme-text-muted text-center">殺傷</label><input type="number" value={unit.buffs.lethality} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, lethality: Number(e.target.value)})} disabled={disabled} className="w-full text-center theme-input p-0.5 rounded font-bold text-xs" /></div>
                    <div><label className="block text-[10.5px] theme-text-muted text-center">HP</label><input type="number" value={unit.buffs.hp} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, hp: Number(e.target.value)})} disabled={disabled} className="w-full text-center theme-input p-0.5 rounded font-bold text-xs" /></div>
                </div>
            </div>
            <div className="text-xs theme-log-container p-2 rounded flex justify-between items-center font-mono">
                <div className="flex gap-3">
                    <span>攻: {fAtk}</span><span>防: {fDef}</span><span>殺: {fLet}</span><span>HP: {fHp}</span>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-700/30 pl-3 ml-2">
                    <span className="theme-text-muted text-xs">残存:</span>
                    <span className={`text-base font-bold ${unit.troops === 0 ? "text-slate-500" : side === 'ally' ? "theme-ally-win-text" : "theme-enemy-win-text"}`}>{unit.troops.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export const ArmyPanel = ({ 
    side, 
    title, 
    army, 
    bgColor, 
    borderColor, 
    titleColor, 
    turn, 
    onHeroChange, 
    onUnitChange, 
    heroDB,
    heroPresets = { 1: null, 2: null, 3: null, 4: null, 5: null },
    onLoadHeroPreset,
    onSaveHeroPreset,
    unitPresets = {
        shield: { 1: null, 2: null, 3: null, 4: null, 5: null },
        spear: { 1: null, 2: null, 3: null, 4: null, 5: null },
        bow: { 1: null, 2: null, 3: null, 4: null, 5: null }
    },
    onLoadUnitPreset,
    onSaveUnitPreset
}) => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleSlotClick = (num) => {
        if (isRegisterMode) {
            onSaveHeroPreset(num, army.heroes);
            setIsRegisterMode(false);
        } else {
            const preset = heroPresets[num];
            if (preset) {
                onLoadHeroPreset(side, preset);
            }
        }
    };

    return (
        <div className={`flex-1 ice-panel ${side === 'ally' ? 'ice-panel-ally' : 'ice-panel-enemy'} p-3 rounded-xl border-t-4 ${borderColor}`}>
            <h2 className={`text-lg font-black ${side === 'ally' ? 'theme-ally-win-text' : 'theme-enemy-win-text'} mb-3 flex justify-between`}>
                {title}
                <span className="text-sm font-normal theme-text-muted">総兵力: {(army.shield.troops + army.spear.troops + army.bow.troops).toLocaleString()}</span>
            </h2>
            <div className="theme-hero-section p-2 rounded-lg shadow-inner mb-4">
                <div className="flex justify-between items-center mb-2 border-b border-slate-650/40 pb-1">
                    <h4 className="font-bold text-yellow-500 text-xs">👑 英雄編成</h4>
                    <button 
                        onClick={() => setIsRegisterMode(!isRegisterMode)}
                        className={`preset-btn-register ${isRegisterMode ? 'active' : ''}`}
                        disabled={turn > 0}
                    >
                        {isRegisterMode ? 'スロット選択...' : 'Preset 💾'}
                    </button>
                </div>
                <div className="w-full mb-3 border-b border-slate-650/20 pb-2">
                    <div className="preset-slots-container">
                        {[1, 2, 3, 4, 5].map(num => {
                            const hasData = !!heroPresets[num];
                            return (
                                <div key={num} className="relative flex-1">
                                    <button
                                        onClick={() => handleSlotClick(num)}
                                        className={`preset-slot-btn w-full ${
                                            isRegisterMode 
                                                ? 'register-active' 
                                                : hasData 
                                                    ? 'has-data' 
                                                    : 'empty'
                                        }`}
                                        disabled={turn > 0}
                                        title={isRegisterMode ? `${num}番に保存` : hasData ? `スロット${num}をロード` : '未登録'}
                                    >
                                        {num}
                                    </button>
                                    {isRegisterMode && hasData && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`スロット${num}のデータを削除しますか？`)) {
                                                    onSaveHeroPreset(num, null);
                                                }
                                            }}
                                            className="preset-slot-clear-btn"
                                            title="クリア"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
            <UnitInput 
                label="🛡️ 盾兵" 
                unit={army.shield} 
                type="shield" 
                side={side} 
                onChange={onUnitChange} 
                disabled={turn > 0} 
                isStunned={army.shield.stunned} 
                unitPresets={unitPresets ? unitPresets.shield : undefined}
                onLoadUnitPreset={onLoadUnitPreset}
                onSaveUnitPreset={onSaveUnitPreset}
            />
            <UnitInput 
                label="🗡️ 槍兵" 
                unit={army.spear} 
                type="spear" 
                side={side} 
                onChange={onUnitChange} 
                disabled={turn > 0} 
                isStunned={army.spear.stunned} 
                unitPresets={unitPresets ? unitPresets.spear : undefined}
                onLoadUnitPreset={onLoadUnitPreset}
                onSaveUnitPreset={onSaveUnitPreset}
            />
            <UnitInput 
                label="🏹 弓兵" 
                unit={army.bow} 
                type="bow" 
                side={side} 
                onChange={onUnitChange} 
                disabled={turn > 0} 
                isStunned={army.bow.stunned} 
                unitPresets={unitPresets ? unitPresets.bow : undefined}
                onLoadUnitPreset={onLoadUnitPreset}
                onSaveUnitPreset={onSaveUnitPreset}
            />
        </div>
    );
};
