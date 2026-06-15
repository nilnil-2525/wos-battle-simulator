import React from 'react';
import { baseStatsData } from '../utils/battleSimulator.js';

export const HeroSelector = ({ side, role, label, allowedType, value, onChange, disabled, heroDB }) => (
    <div className="flex items-center justify-between bg-slate-700 p-1.5 rounded mb-1">
        <span className="text-[10px] font-bold text-slate-300 w-16">{label}</span>
        <select className="flex-1 bg-slate-600 text-white text-[11px] p-1 rounded font-bold border-none outline-none cursor-pointer" value={value} onChange={e => onChange(side, role, e.target.value)} disabled={disabled}>
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

    return (
        <div className={`p-3 mb-3 rounded-xl border shadow-sm relative ${side === 'ally' ? 'bg-blue-50/50 border-blue-200' : 'bg-red-50/50 border-red-200'}`}>
            {isStunned && <div className="absolute top-2 right-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow animate-pulse">🌀 スタン中</div>}
            <h4 className={`font-bold text-sm mb-2 ${side === 'ally' ? 'text-blue-800' : 'text-red-800'}`}>{label}</h4>
            <div className="flex items-center gap-2 mb-2">
                <label className="text-[11px] font-bold text-gray-600">Tier</label>
                <select className="border rounded p-0.5 bg-white font-bold text-xs" value={unit.tier} onChange={(e) => onChange(side, type, 'tier', Number(e.target.value))} disabled={disabled}>
                    {[1,5,6,8,11].map(t => <option key={t} value={t}>{t === 11 ? "T11 (fc10)" : `T${t}`}</option>)}
                </select>
                <label className="text-[11px] font-bold text-gray-600 ml-2">兵士数</label>
                <input type="number" className="flex-1 border rounded p-0.5 font-bold text-xs" value={unit.initialTroops} onChange={(e) => onChange(side, type, 'initialTroops', Math.max(0, Number(e.target.value)))} disabled={disabled} />
            </div>
            <div className="bg-white p-2 rounded border mb-2">
                <h5 className="text-[10px] font-bold text-gray-500 mb-1">ステータスバフ (%)</h5>
                <div className="grid grid-cols-4 gap-1 text-xs">
                    <div><label className="block text-[9px] text-gray-400 text-center">攻撃</label><input type="number" value={unit.buffs.attack} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, attack: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">防御</label><input type="number" value={unit.buffs.defense} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, defense: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">殺傷</label><input type="number" value={unit.buffs.lethality} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, lethality: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">HP</label><input type="number" value={unit.buffs.hp} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, hp: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                </div>
            </div>
            <div className="text-[10px] bg-slate-100 p-1.5 rounded flex justify-between font-mono text-slate-600">
                <span>攻:{fAtk}</span><span>防:{fDef}</span><span>殺:{fLet}</span><span>HP:{fHp}</span>
            </div>
            <div className="mt-2 text-right bg-white p-1.5 rounded border flex justify-between items-center shadow-inner">
                <span className="text-gray-500 text-[11px]">残存兵力</span>
                <span className={`text-base font-bold ${unit.troops === 0 ? "text-gray-400" : side === 'ally' ? "text-blue-600" : "text-red-600"}`}>{unit.troops.toLocaleString()}</span>
            </div>
        </div>
    );
};

export const ArmyPanel = ({ side, title, army, bgColor, borderColor, titleColor, turn, onHeroChange, onUnitChange, heroDB }) => (
    <div className={`flex-1 bg-white p-3 rounded-xl shadow-md border-t-4 ${borderColor}`}>
        <h2 className={`text-lg font-black ${titleColor} mb-3 flex justify-between`}>{title}<span className="text-sm font-normal">総兵力: {(army.shield.troops + army.spear.troops + army.bow.troops).toLocaleString()}</span></h2>
        <div className="bg-slate-800 p-2 rounded-lg shadow-inner mb-4">
            <h4 className="font-bold text-yellow-400 text-xs mb-2 border-b border-slate-600 pb-1">👑 英雄編成</h4>
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
        <UnitInput label="🛡️ 盾兵" unit={army.shield} type="shield" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.shield.stunned} />
        <UnitInput label="🗡️ 槍兵" unit={army.spear} type="spear" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.spear.stunned} />
        <UnitInput label="🏹 弓兵" unit={army.bow} type="bow" side={side} onChange={onUnitChange} disabled={turn > 0} isStunned={army.bow.stunned} />
    </div>
);
