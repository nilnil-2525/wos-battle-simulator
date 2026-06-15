const { useState, useEffect, useRef } = React;

const baseStatsData = {
    shield: { 1: { attack: 63, lethality: 10, defense: 10, hp: 189 }, 5: { attack: 206, lethality: 10, defense: 10, hp: 619 }, 6: { attack: 243, lethality: 10, defense: 10, hp: 730 }, 8: { attack: 339, lethality: 10, defense: 10, hp: 1017 }, 11: { attack: 913, lethality: 10, defense: 10, hp: 2741 } },
    spear: { 1: { attack: 189, lethality: 10, defense: 10, hp: 63 }, 5: { attack: 619, lethality: 10, defense: 10, hp: 206 }, 6: { attack: 730, lethality: 10, defense: 10, hp: 243 }, 8: { attack: 1017, lethality: 10, defense: 10, hp: 339 }, 11: { attack: 2741, lethality: 10, defense: 10, hp: 913 } },
    bow: { 1: { attack: 252, lethality: 10, defense: 10, hp: 47 }, 5: { attack: 825, lethality: 10, defense: 10, hp: 155 }, 6: { attack: 974, lethality: 10, defense: 10, hp: 183 }, 8: { attack: 1356, lethality: 10, defense: 10, hp: 254 }, 11: { attack: 3656, lethality: 10, defense: 10, hp: 629 } }
};

const INITIAL_HERO_DB = {
    none: { name: "- なし -", type: "none", skills: {} },
    jeronimo: { name: "ジェロニモ", type: "shield", skills: { 1: [ { category: "DamageUp1", target: "all", timing: "always", value: 0.25, name: "殺傷+" } ], 2: [ { category: "DamageUp3", target: "all", timing: "always", value: 0.25, name: "攻撃+" } ], 3: [ { category: "DamageUp2", target: "all", timing: "turn_4n", duration: 2, value: 0.30, name: "与ダメ+" } ] } },
    edith: { name: "エディス", type: "shield", skills: { 1: [ { category: "DefenseUp3", target: "bow", timing: "always", value: 0.20, name: "弓被ダメ低下+" }, { category: "DamageUp2", target: "spear", timing: "always", value: 0.20, name: "槍与ダメ+" } ], 2: [ { category: "DefenseUp3", target: "shield", timing: "always", value: 0.20, name: "盾被ダメ低下+" } ], 3: [ { category: "DefenseUp1", target: "all", timing: "always", value: 0.25, name: "部隊HP+" } ] } },
    gato: { name: "ガト", type: "shield", skills: { 1: [ { category: "DefenseUp2", target: "shield", timing: "always", value: 0.30, name: "盾防御+" } ], 2: [ { category: "DefenseUpS", target: "shield", timing: "after_shield_attack", duration: 1, value: 0.30, name: "盾被ダメ低下+" } ], 3: [ { category: "OppDamageDown2", target: "all_enemy", timing: "always", value: 0.25, name: "敵攻撃低下+" } ] } },
    gordon: { name: "ゴードン", type: "spear", skills: { 1: [ { category: "ExtraDamageUp", target: "spear", timing: "spear_even_attack_instant", value: 1.00, name: "攻撃時即追加ダメ+" }, { category: "OppDamageDown1", target: "spear_target", timing: "spear_even_attack_after", value: 0.20, name: "対象の殺傷低下+" } ], 2: [ { category: "DamageUp2", target: "spear", timing: "turn_3n", duration: 1, value: 1.50, name: "槍与ダメ+" }, { category: "OppDamageDown1", target: "all_enemy", timing: "turn_3n", duration: 1, value: 0.30, name: "敵全体殺傷低下+" } ], 3: [ { category: "OppDefenseDown1", target: "enemy_shield", timing: "turn_4n", duration: 2, value: 0.30, name: "敵盾被ダメ上昇+" }, { category: "OppDamageDown1", target: "enemy_bow", timing: "turn_4n", duration: 2, value: 0.30, name: "敵弓殺傷低下+" } ] } },
    sonya: { name: "ソニヤ", type: "spear", skills: { 1: [ { category: "DamageUp2", target: "all", timing: "always", value: 0.20, name: "与ダメ+" } ], 2: [ { category: "ExtraDamageUp", target: "spear", timing: "spear_even_attack_instant", value: 0.75, name: "攻撃時即追加ダメ+" }, { category: "DamageUp3", target: "all", timing: "spear_even_attack_after", value: 0.25, name: "攻撃+" } ], 3: [ { category: "ExtraDamageUp", target: "spear", timing: "turn_5n_instant", value: 2.50, name: "攻撃時即追加ダメ(スタン)+" } ] } },
    bradley: { name: "ブラッドリー", type: "bow", skills: { 1: [ { category: "DamageUp3", target: "all", timing: "always", value: 0.25, name: "攻撃+" } ], 2: [ { category: "DamageUpB", target: "all", timing: "always", value: 0.25, name: "HP低下デバフ+" } ], 3: [ { category: "DamageUp2", target: "all", timing: "turn_4n", duration: 2, value: 0.30, name: "与ダメ+" } ] } },
    hendrick: { name: "ヘンドリック", type: "bow", skills: { 1: [ { category: "OppDefenseDown2", target: "all_enemy", timing: "always", value: 0.25, name: "敵防御低下+" } ], 2: [ { category: "DefenseUp2", target: "all", timing: "turn_4n", duration: 2, value: 0.30, name: "防御+" } ], 3: [ { category: "Hendrick3", target: "all_enemy", timing: "turn_3n_instant", value: 0.40, name: "3T毎追加全体攻撃+" } ] } },
    mia: { name: "ミア", type: "spear", skills: { 1: [ { category: "OppDefenseDown1", target: "enemy_target", timing: "mia_atk_prob_50", value: 0.50, name: "攻撃時確率被ダ増+" } ], 2: [ { category: "ExtraDamageUp", target: "self", timing: "mia_atk_prob_50_ex", value: 0.50, name: "攻撃時確率追加ダメ+" } ], 3: [ { category: "DefenseUp3", target: "all", timing: "mia_turn_prob_40", duration: 1, value: 0.50, name: "毎T確率被ダ減+" } ] } },
    jessie: { name: "ジェシー", type: "any", skills: { 1: [ { category: "DamageUp1", target: "all", timing: "always", value: 0.25, name: "殺傷+" } ] } },
    soyun: { name: "ソユン", type: "any", skills: { 1: [ { category: "DamageUp3", target: "all", timing: "always", value: 0.25, name: "攻撃+" } ] } },
    patrick: { name: "パトリック", type: "any", skills: { 1: [ { category: "DefenseUp1", target: "all", timing: "always", value: 0.25, name: "HP+" } ] } },
    flender: { name: "フレンダー", type: "any", skills: { 1: [ { category: "DamageUp3", target: "all", timing: "always", value: 0.15, name: "攻撃+" }, { category: "DefenseUp2", target: "all", timing: "always", value: 0.10, name: "防御+" } ] } },
    bowgun: { name: "ボーガン", type: "any", skills: { 1: [ { category: "OppDamageDown1", target: "all_enemy", timing: "always", value: 0.20, name: "敵殺傷低下+" } ] } },
    rinsetsu: { name: "リンセツ", type: "any", skills: { 1: [ { category: "OppDamageDown2", target: "all_enemy", timing: "always", value: 0.20, name: "敵攻撃低下+" } ] } },
    mumei: { name: "無名", type: "any", skills: { 1: [ { category: "DefenseUp3", target: "shield", timing: "always", value: 0.25, name: "通常耐性+" } ] } },
    reina: { name: "レイナ", type: "any", skills: { 1: [ { category: "NormalDamageUp", target: "all", timing: "always", value: 0.30, name: "通常与ダメ+" } ] } },
    rene: { name: "レネ", type: "any", skills: { 1: [ { category: "ExtraDamageUp", target: "spear", timing: "spear_rene_timing", duration: 1, value: 2.00, name: "槍追加攻撃+" } ] } },
    nora: { name: "ノラ", type: "any", skills: { 1: [ { category: "DamageUp2", target: "shield", timing: "always", value: 0.15, name: "盾与ダメ+" }, { category: "DamageUp2", target: "bow", timing: "always", value: 0.15, name: "弓与ダメ+" }, { category: "DefenseUp3", target: "shield", timing: "always", value: 0.15, name: "盾被ダメ低下+" }, { category: "DefenseUp3", target: "bow", timing: "always", value: 0.15, name: "弓被ダメ低下+" } ] } }
};

const createInitialUnit = (tier, troops, attack, lethality, defense, hp) => ({ tier, initialTroops: troops, troops, buffs: { attack, lethality, defense, hp }, stunned: false });

const createInitialStats = () => ({ 
    resshoCount: 0, kisyuCount: 0, enshoCount: 0, shiretsuCount: 0, renshaCount: 0, renshaKills: 0, nenshoCount: 0, nenshoKills: 0,
    heroSkillCounts: {} // { "heroName_skillLevel": count }
});

const initialArmyState = {
    shield: createInitialUnit(11, 5000, 0, 0, 0, 0), spear: createInitialUnit(11, 3000, 0, 0, 0, 0), bow: createInitialUnit(11, 2000, 0, 0, 0, 0),
    heroes: { leaderShield: 'none', leaderSpear: 'none', leaderBow: 'none', rider1: 'none', rider2: 'none', rider3: 'none', rider4: 'none' },
    spearAttackCount: 0, activeBuffs: [], stats: createInitialStats()
};

const calcStats = (data) => {
    if (!data || data.length === 0) return { mean: 0, median: 0, variance: 0, stdDev: 0 };
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const variance = sorted.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sorted.length;
    return { mean: Math.round(mean), median: Math.round(median), variance: Math.round(variance), stdDev: Math.round(Math.sqrt(variance)) };
};

const HeroSelector = ({ side, role, label, allowedType, value, onChange, disabled, heroDB }) => (
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

const UnitInput = ({ label, unit, type, side, onChange, disabled, isStunned }) => {
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
                {/* 🌟 V39 UI改善: 攻撃 ➔ 防御 ➔ 殺傷 ➔ HP の順に変更 */}
                <div className="grid grid-cols-4 gap-1 text-xs">
                    <div><label className="block text-[9px] text-gray-400 text-center">攻撃</label><input type="number" value={unit.buffs.attack} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, attack: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">防御</label><input type="number" value={unit.buffs.defense} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, defense: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">殺傷</label><input type="number" value={unit.buffs.lethality} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, lethality: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                    <div><label className="block text-[9px] text-gray-400 text-center">HP</label><input type="number" value={unit.buffs.hp} onChange={(e) => onChange(side, type, 'buffs', { ...unit.buffs, hp: Number(e.target.value)})} disabled={disabled} className="w-full text-center border p-0.5 rounded font-bold text-[11px]" /></div>
                </div>
            </div>
            {/* 🌟 テキスト表記も 攻 防 殺 HP の順に修正 */}
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

const ArmyPanel = ({ side, title, army, bgColor, borderColor, titleColor, turn, onHeroChange, onUnitChange, heroDB }) => (
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

const InlineSkillDictionary = ({ heroDB }) => {
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

const SkillTestEditorModal = ({ currentDB, onSave, onClose }) => {
    const [tempDB, setTempDB] = useState(JSON.parse(JSON.stringify(currentDB)));

    const ALL_CATEGORIES = [
        { val: "DamageUp1", label: "DamageUp1 (分子: 与ダメUP/殺傷バフ)" }, { val: "DamageUp2", label: "DamageUp2 (分子: 与ダメUP/槍与ダメバフ等)" }, { val: "DamageUp3", label: "DamageUp3 (分子: 与ダメUP/攻撃バフ)" },
        { val: "NormalDamageUp", label: "NormalDamageUp (分子: 通常与ダメバフ)" }, { val: "ExtraDamageUp", label: "ExtraDamageUp (分子: 追加ダメージ枠)" },
        { val: "OppDefenseDown1", label: "OppDefenseDown1 (分子: 敵盾被ダメ上昇)" }, { val: "OppDefenseDown2", label: "OppDefenseDown2 (分子: 敵防御低下)" },
        { val: "DefenseUp1", label: "DefenseUp1 (分母: 被ダメ低下/全部隊HPバフ等)" }, { val: "DefenseUp2", label: "DefenseUp2 (分母: 被ダメ低下/全部隊防御バフ等)" },
        { val: "DefenseUp3", label: "DefenseUp3 (分母: 被ダメ低下/盾通常耐性等)" }, { val: "DefenseUpS", label: "DefenseUpS (分母: 被ダメ低下/ガト特殊盾被ダメ低下)" },
        { val: "OppDamageDown1", label: "OppDamageDown1 (分母: 敵殺傷低下)" }, { val: "OppDamageDown2", label: "OppDamageDown2 (分母: 敵攻撃低下)" },
        { val: "Hendrick3", label: "Hendrick3 (ヘンドリックⅢ専用: 3T毎敵全体追加攻撃)" }
    ];

    const TARGET_OPTIONS = [
        { val: 'all', label: '味方全体' }, { val: 'shield', label: '味方盾兵' }, { val: 'spear', label: '味方槍兵' }, { val: 'bow', label: '味方弓兵' }, { val: 'self', label: '自身(攻撃部隊)' },
        { val: 'all_enemy', label: '敵全体' }, { val: 'enemy_shield', label: '敵盾兵' }, { val: 'enemy_spear', label: '敵槍兵' }, { val: 'enemy_bow', label: '敵弓兵' },
        { val: 'spear_target', label: '槍の攻撃対象' }, { val: 'enemy_target', label: '攻撃時の対象' }
    ];

    const TIMING_OPTIONS = [
        { val: 'always', label: '永続' }, { val: 'turn_3n', label: '3T毎' }, { val: 'turn_4n', label: '4T毎' }, { val: 'turn_3n_instant', label: '3T毎即時' }, { val: 'turn_5n_instant', label: '5T毎即時(スタン)' },
        { val: 'after_shield_attack', label: '盾攻撃後' }, { val: 'spear_even_attack_after', label: '槍偶数回(後)' }, { val: 'spear_even_attack_instant', label: '槍偶数回(即時)' }, { val: 'spear_rene_timing', label: 'レネのタイミング' },
        { val: 'mia_atk_prob_50', label: 'ミア：各部隊攻撃時50%(2T~)' }, { val: 'mia_atk_prob_50_ex', label: 'ミア：各部隊攻撃時50%' }, { val: 'mia_turn_prob_40', label: 'ミア：ターン開始時40%' }
    ];

    const handleChange = (heroKey, level, skillIndex, field, val) => {
        const newData = { ...tempDB }; const skill = newData[heroKey].skills[level][skillIndex];
        if (field === 'value') skill.value = Number(val) / 100; else skill[field] = val; setTempDB(newData);
    };

    const resetToDefault = () => { if(confirm("初期状態(最大レベル状態)にリセットしますか？")) setTempDB(JSON.parse(JSON.stringify(INITIAL_HERO_DB))); };

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
                                                        <div className="flex flex-col gap-0.5"><label className="text-slate-500 text-[10px]">種別(計算上の枠):</label><select className="border p-1 rounded bg-slate-100 w-full text-[10px] font-bold text-indigo-800" value={skill.category} onChange={(e) => handleChange(heroKey, level, index, 'category', e.target.value)}>{ALL_CATEGORIES.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between mt-1"><label className="text-slate-500 text-[10px]">対象:</label><select className="border p-1 rounded bg-white w-2/3 text-[10px]" value={skill.target} onChange={(e) => handleChange(heroKey, level, index, 'target', e.target.value)}>{TARGET_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
                                                        <div className="flex items-center justify-between"><label className="text-slate-500 text-[10px]">条件:</label><select className="border p-1 rounded bg-white w-2/3 text-[10px]" value={skill.timing} onChange={(e) => handleChange(heroKey, level, index, 'timing', e.target.value)}>{TIMING_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}</select></div>
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

const WinRateChart = ({ results }) => {
    const canvasRef = useRef(null); const chartRef = useRef(null);
    useEffect(() => {
        if (!results || results.length === 0) return;
        let allyWins = 0, enemyWins = 0, draws = 0;
        results.forEach(r => { if (r.winner === 'ally') allyWins++; else if (r.winner === 'enemy') enemyWins++; else draws++; });
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'doughnut', data: { labels: ['味方勝利', '敵勝利', '引き分け'], datasets: [{ data: [allyWins, enemyWins, draws], backgroundColor: ['#3b82f6', '#ef4444', '#94a3b8'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, cutout: '70%' }
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [results]);
    return <div className="h-40 relative"><canvas ref={canvasRef}></canvas></div>;
};

const HistogramChart = ({ data, color, label }) => {
    const canvasRef = useRef(null); const chartRef = useRef(null);
    useEffect(() => {
        if (!data || data.length === 0) return;
        const min = Math.floor(Math.min(...data)); const max = Math.ceil(Math.max(...data));
        const diff = max - min === 0 ? 100 : max - min; const binWidth = diff / 10;
        const bins = new Array(10).fill(0);
        data.forEach(val => { let index = Math.floor((val - min) / binWidth); if (index >= 10) index = 9; bins[index]++; });
        const labels = Array.from({length: 10}, (_, i) => { const start = Math.floor(min + i * binWidth); return `${start.toLocaleString()}~`; });
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
            type: 'bar', data: { labels: labels, datasets: [{ label: label, data: bins, backgroundColor: color, borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 9 } } } } }
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [data]);
    return <div className="h-40 relative"><canvas ref={canvasRef}></canvas></div>;
};

const App = () => {
    const [heroDB, setHeroDB] = useState(JSON.parse(JSON.stringify(INITIAL_HERO_DB)));
    const [armyData, setArmyData] = useState({ ally: JSON.parse(JSON.stringify(initialArmyState)), enemy: JSON.parse(JSON.stringify(initialArmyState)) });
    const [logs, setLogs] = useState([]);
    const [turn, setTurn] = useState(0);
    const [fixedMinTroops, setFixedMinTroops] = useState(0);
    
    const [activeTab, setActiveTab] = useState('single');
    const [simResults, setSimResults] = useState(null);
    const [showDict, setShowDict] = useState(false);
    const [showEditor, setShowEditor] = useState(false); 
    
    const logContainerRef = useRef(null);

    useEffect(() => { 
        if (logContainerRef.current && activeTab === 'single') {
            logContainerRef.current.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [logs, activeTab]);

    const handleHeroChange = (side, role, heroKey) => { setArmyData(prev => { const newData = JSON.parse(JSON.stringify(prev)); newData[side].heroes[role] = heroKey; return newData; }); };
    const handleUnitChange = (side, type, field, value) => {
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            if (field === 'initialTroops') { newData[side][type].initialTroops = value; newData[side][type].troops = value; }
            else if (field === 'buffs') newData[side][type].buffs = value;
            else newData[side][type][field] = value;
            return newData;
        });
    };

    const handleReset = () => {
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            ['ally', 'enemy'].forEach(side => {
                ['shield', 'spear', 'bow'].forEach(type => { newData[side][type].troops = newData[side][type].initialTroops; newData[side][type].stunned = false; });
                newData[side].spearAttackCount = 0; newData[side].stunTurnOffset = 0; newData[side].activeBuffs = []; newData[side].stats = createInitialStats();
            });
            return newData;
        });
        setLogs([]); setTurn(0); setFixedMinTroops(0); setSimResults(null);
    };

    const handleSaveHeroDB = (newDB) => { setHeroDB(newDB); setShowEditor(false); setLogs(prev => [...prev, "==== システム通知 ====", "⚙️ エディタから英雄スキルデータを更新・適用しました！"]); };

    const getTotalTroops = (army) => army.shield.troops + army.spear.troops + army.bow.troops;
    
    const getTarget = (army) => {
        if (army.shield.troops > 0) return 'shield';
        if (army.spear.troops > 0) return 'spear';
        if (army.bow.troops > 0) return 'bow';
        return null;
    };

    const buildSkillPool = (heroesObj) => {
        const pool = [];
        const addSkills = (heroKey, levels) => {
            if (heroKey === 'none' || !heroDB[heroKey]) return;
            // 🌟 V39変更: スキルレベル名をマッピング（Ⅰ, Ⅱ, Ⅲ）して付与
            const levelSymbols = { 1: 'Ⅰ', 2: 'Ⅱ', 3: 'Ⅲ' };
            levels.forEach(lvl => {
                if (heroDB[heroKey].skills[lvl]) {
                    heroDB[heroKey].skills[lvl].forEach(skill => {
                        pool.push({ 
                            ...skill, 
                            heroKey: heroKey, 
                            heroName: heroDB[heroKey].name, 
                            simpleName: `${heroDB[heroKey].name}${levelSymbols[lvl]}`, // 例: ソニヤⅡ
                            name: `${skill.name}${(skill.value * 100).toFixed(1)}%` 
                        });
                    });
                }
            });
        };
        addSkills(heroesObj.leaderShield, [1, 2, 3]); addSkills(heroesObj.leaderSpear, [1, 2, 3]); addSkills(heroesObj.leaderBow, [1, 2, 3]);
        addSkills(heroesObj.rider1, [1]); addSkills(heroesObj.rider2, [1]); addSkills(heroesObj.rider3, [1]); addSkills(heroesObj.rider4, [1]);
        return pool;
    };

    const sumBuffCategory = (buffs, targetCategory, unitType, enemyTargetType, isMyBuff) => {
        let sum = 0;
        buffs.forEach(b => {
            if (b.category !== targetCategory) return;
            let match = false;
            if (isMyBuff) { if (b.target === 'all' || b.target === unitType || b.target === 'self') match = true; } 
            else { if (b.target === 'all_enemy' || b.target === `enemy_${unitType}`) match = true; if ((b.target === 'spear_target' || b.target === 'enemy_target') && b.attackedTarget === unitType) match = true; if (b.target === 'spear_target' && b.attackedTarget === enemyTargetType) match = true; }
            if (match) sum += b.value;
        });
        return sum;
    };

    // 🌟 英雄スキルの発動をシンプルに記録
    const recordHeroSkill = (army, skill, logger, isSilent, isInstant = false) => {
        // simpleName（ソニヤⅡ など）をキーにして集計
        const skillId = `${skill.heroKey}_${skill.simpleName}`;
        if (!army.stats.heroSkillCounts[skillId]) {
            army.stats.heroSkillCounts[skillId] = { name: skill.simpleName, count: 0 };
        }
        army.stats.heroSkillCounts[skillId].count++;
        if (logger && !isSilent && isInstant) logger(`  ⚡ [即時スキル発動] ${skill.heroName}: ${skill.name}`);
    };

    const calculateDamageSplit = (atkType, defType, atkArmy, defArmy, minTotalTroops, logger, currentTurn, isEvenAttack, atkSkillPool, isOverallHendrickAttacking = false, isSilent = false, resolvedMiaOppDefDown = 0) => {
        const atkUnit = atkArmy[atkType]; const defUnit = defArmy[defType];
        const atkBase = baseStatsData[atkType][atkUnit.tier]; const defBase = baseStatsData[defType][defUnit.tier];

        let hpDiv = 1.0; if (defArmy.heroes.leaderBow === 'bradley') { if (defType === 'shield') hpDiv = 1.25; if (defType === 'spear') hpDiv = 1.30; }
        let t11BowPassiveAtkMult = (atkType === 'bow' && atkUnit.tier === 11) ? 1.06 : 1.0;
        let t11ShieldPassiveDefMult = (defType === 'shield' && defUnit.tier === 11) ? 1.06 : 1.0;

        const aAtk = atkBase.attack * (1 + atkUnit.buffs.attack / 100) * t11BowPassiveAtkMult;
        const aLet = atkBase.lethality * (1 + atkUnit.buffs.lethality / 100);
        const dDef = defBase.defense * (1 + defUnit.buffs.defense / 100) * t11ShieldPassiveDefMult;
        const dHp = (defBase.hp * (1 + defUnit.buffs.hp / 100)) / hpDiv;

        const myBuffs = atkArmy.activeBuffs; const enemyBuffs = defArmy.activeBuffs;

        // ミアⅠ（敵被ダメ上昇）は呼び出し元で抽選済みの値を使用（通常攻撃・ヘンドリックⅢ共通）
        let miaOppDefDown = resolvedMiaOppDefDown; let miaExtraDmg = 0;
        if (!isOverallHendrickAttacking) {
            const miaSkill2s = atkSkillPool.filter(s => s.timing === 'mia_atk_prob_50_ex');
            if (miaSkill2s.length > 0 && Math.random() < 0.50) {
                miaSkill2s.forEach(s => { miaExtraDmg += s.value; recordHeroSkill(atkArmy, s, logger, isSilent, true); });
            }
        }

        const dmgUp1 = sumBuffCategory(myBuffs, 'DamageUp1', atkType, null, true); const dmgUp2 = sumBuffCategory(myBuffs, 'DamageUp2', atkType, null, true);
        const dmgUp3 = sumBuffCategory(myBuffs, 'DamageUp3', atkType, null, true); const normalDmgUp = sumBuffCategory(myBuffs, 'NormalDamageUp', atkType, null, true);
        const oppDefDown1 = sumBuffCategory(myBuffs, 'OppDefenseDown1', null, defType, false) + miaOppDefDown;
        const oppDefDown2 = sumBuffCategory(myBuffs, 'OppDefenseDown2', null, defType, false);
        const defUp1 = sumBuffCategory(enemyBuffs, 'DefenseUp1', defType, null, true); const defUp2 = sumBuffCategory(enemyBuffs, 'DefenseUp2', defType, null, true);
        let defUp3 = sumBuffCategory(enemyBuffs, 'DefenseUp3', defType, null, true); const defUpS = sumBuffCategory(enemyBuffs, 'DefenseUpS', defType, null, true);
        const oppDmgDown1 = sumBuffCategory(enemyBuffs, 'OppDamageDown1', atkType, defType, false); const oppDmgDown2 = sumBuffCategory(enemyBuffs, 'OppDamageDown2', atkType, defType, false);

        const normalNumerator = (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + normalDmgUp) * (1 + oppDefDown1) * (1 + oppDefDown2);
        const commonDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + defUp3) * (1 + defUpS);
        const normalSkillMod = normalNumerator / commonDenominator;

        let exDmgUp = sumBuffCategory(myBuffs, 'ExtraDamageUp', atkType, null, true) + miaExtraDmg;
        let instantLog = "";
        let hasStunApplied = false;
        
        let t11BowExtraAtk = 0; let renshaActive = false; let nenshoActive = false;
        if (atkType === 'bow' && atkUnit.tier === 11 && !isOverallHendrickAttacking) {
            if (Math.random() < 0.10) { t11BowExtraAtk += 1.00; renshaActive = true; atkArmy.stats.renshaCount++; if (logger && !isSilent) logger(`🎲 [兵士スキル] 弓兵【連射】発動！`); }
            if (Math.random() < 0.30) { t11BowExtraAtk += 0.875; nenshoActive = true; atkArmy.stats.nenshoCount++; if (logger && !isSilent) logger(`🎲 [兵士スキル] 弓兵【燃晶火薬】発動！`); }
        }

        atkSkillPool.forEach(skill => {
            if (atkType === 'spear' && isEvenAttack && skill.timing === 'spear_even_attack_instant') { 
                exDmgUp += skill.value; instantLog += `[${skill.heroName}+${(skill.value*100).toFixed(1)}%] `; 
                recordHeroSkill(atkArmy, skill, logger, isSilent, false); // 表示は即時ログにまとめるため
            }
            if (atkType === 'spear' && (currentTurn - (atkArmy.stunTurnOffset||0)) % 5 === 0 && (currentTurn - (atkArmy.stunTurnOffset||0)) > 0 && skill.timing === 'turn_5n_instant') { 
                exDmgUp += skill.value; instantLog += `[${skill.heroName}Ⅲ+${(skill.value*100).toFixed(1)}%] `; 
                hasStunApplied = true; 
                recordHeroSkill(atkArmy, skill, logger, isSilent, false);
            }
        });

        if (isOverallHendrickAttacking) exDmgUp = 0.40;
        else exDmgUp += t11BowExtraAtk;

        let exDefUp3 = defUp3;
        if (enemyBuffs.some(b => b.heroName === '無名' && defType === 'shield') && exDmgUp > 0) exDefUp3 = defUp3 - 0.25 + 0.30;

        const exDenominator = (1 + oppDmgDown1) * (1 + oppDmgDown2) * (1 + defUp1) * (1 + defUp2) * (1 + exDefUp3) * (1 + defUpS);
        const exNumerator = exDmgUp * (1 + dmgUp1) * (1 + dmgUp2) * (1 + dmgUp3) * (1 + oppDefDown1) * (1 + oppDefDown2);
        const exSkillMod = exNumerator / exDenominator;

        let multiplier = 1.0; let t7Reduc = 1.0;
        if ((atkType === 'shield' && defType === 'spear') || (atkType === 'spear' && defType === 'bow') || (atkType === 'bow' && defType === 'shield')) multiplier = 1.1;
        if (atkType === 'spear' && defType === 'shield' && defUnit.tier >= 7) t7Reduc = 1.1;

        const baseDmg = (aAtk * aLet) / (Math.max(1, dDef) * Math.max(1, dHp)) / 100;
        let rawNormal = isOverallHendrickAttacking ? 0 : (baseDmg * Math.sqrt(atkUnit.troops) * Math.sqrt(minTotalTroops) * multiplier * normalSkillMod / t7Reduc);
        let rawExtra = exDmgUp > 0 ? (baseDmg * Math.sqrt(atkUnit.troops) * Math.sqrt(minTotalTroops) * multiplier * exSkillMod / t7Reduc) : 0;

        let t11SpearDmgMult = 1.0;
        if (atkType === 'spear' && atkUnit.tier === 11 && !isOverallHendrickAttacking) {
            if (Math.random() < 0.15) { t11SpearDmgMult = 2.0; atkArmy.stats.enshoCount++; if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【炎晶戦矛】発動！`); }
        }

        let t11ShieldReceiveDiv = 1.0;
        if (defType === 'shield' && defUnit.tier === 11) {
            if (Math.random() < 0.375) { t11ShieldReceiveDiv = 1.51; defArmy.stats.resshoCount++; if (logger && !isSilent) logger(`🎲 [兵士スキル] 盾兵【烈晶盾】発動！`); }
        }

        let t11SpearReceiveDiv = 1.0;
        if (defType === 'spear' && defUnit.tier === 11) {
            if (Math.random() < 0.15) { t11SpearReceiveDiv = 2.0; defArmy.stats.shiretsuCount++; if (logger && !isSilent) logger(`🎲 [兵士スキル] 槍兵【熾烈領域】発動！`); }
        }

        const finalNormalKills = rawNormal * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
        const finalExtraKills = rawExtra * t11SpearDmgMult / (t11ShieldReceiveDiv * t11SpearReceiveDiv);
        const totalKills = Math.round(finalNormalKills + finalExtraKills);

        if (renshaActive) atkArmy.stats.renshaKills += Math.round(finalExtraKills * (1.00 / exDmgUp));
        if (nenshoActive) atkArmy.stats.nenshoKills += Math.round(finalExtraKills * (0.875 / exDmgUp));

        let detailLog = "";
        if (!isSilent) {
            const formatMult = (...vals) => {
                const factors = vals.filter(v => v !== 0).map(v => (1 + v).toFixed(2));
                return factors.length > 0 ? factors.join(' × ') : '1.00';
            };
            const dmgUpStr = formatMult(dmgUp1, dmgUp2, dmgUp3, normalDmgUp);
            const oppDefDownStr = formatMult(oppDefDown1, oppDefDown2);
            const oppDmgDownStr = formatMult(oppDmgDown1, oppDmgDown2);
            const defUpStr = formatMult(defUp1, defUp2, defUp3, defUpS);
            const exDefUpStr = formatMult(defUp1, defUp2, exDefUp3, defUpS);

            detailLog += `  ┣ [計算内訳]:\n`;
            if (instantLog !== "") detailLog += `  ┃ ⚡即時追加: ${instantLog}\n`;
            if (!isOverallHendrickAttacking) {
                detailLog += `  ┃ [通常Mod]: (${dmgUpStr} [与ダバフ] × ${oppDefDownStr} [被ダ増]) / (${oppDmgDownStr} [攻撃低下] × ${defUpStr} [被ダ低下]) = ${normalSkillMod.toFixed(3)}\n`;
            }
            if (exDmgUp > 0) {
                const exDmgUpStr = formatMult(dmgUp1, dmgUp2, dmgUp3);
                detailLog += `  ┃ [追加Mod]: (${exDmgUp.toFixed(2)} [追加倍率] × ${exDmgUpStr} [通常乗算] × ${oppDefDownStr} [被ダ増]) / (${oppDmgDownStr} [攻撃低下] × ${exDefUpStr} [被ダ低下+無名]) = ${exSkillMod.toFixed(3)}\n`;
            }

            let baseNormalStr = Math.round(rawNormal).toLocaleString();
            let baseExtraStr = Math.round(rawExtra).toLocaleString();
            let t11Mods = [];
            if (t11SpearDmgMult > 1) t11Mods.push(`炎晶戦矛×2`);
            if (t11ShieldReceiveDiv > 1) t11Mods.push(`烈晶盾/1.51`);
            if (t11SpearReceiveDiv > 1) t11Mods.push(`熾烈領域/2`);
            let modStr = t11Mods.length > 0 ? ` ➔ [${t11Mods.join(", ")}]` : "";

            detailLog += `  ┗ [撃破数]:\n`;
            if (exDmgUp > 0) {
                detailLog += `     通常: ${baseNormalStr}人${modStr} = ${Math.round(finalNormalKills).toLocaleString()}人\n`;
                detailLog += `     追加: ${baseExtraStr}人${modStr} = ${Math.round(finalExtraKills).toLocaleString()}人`;
            } else {
                detailLog += `     通常: ${baseNormalStr}人${modStr} = ${Math.round(finalNormalKills).toLocaleString()}人`;
            }
        }

        return { totalKills, hasStunApplied, detailLog };
    };

    const triggerBuffs = (army, skillPool, triggerName, logger, sideName, isSilent) => {
        skillPool.forEach(skill => {
            if (skill.timing === triggerName) {
                const isExist = army.activeBuffs.some(b => b.heroName === skill.heroName && b.name === skill.name && b.remain === skill.duration);
                if (!isExist) {
                    army.activeBuffs.push({ ...skill, remain: skill.duration });
                    recordHeroSkill(army, skill, logger, isSilent, true); // 🌟 発動をシンプルに記録
                }
            }
        });
    };

    const processOneTurn = (currentArmyData, currentTurn, fixedMinTroopsSetting, isSilent = false) => {
        let ally = JSON.parse(JSON.stringify(currentArmyData.ally)); let enemy = JSON.parse(JSON.stringify(currentArmyData.enemy));
        let newLogs = isSilent ? [] : [`==== ターン ${currentTurn} ====`];
        const logger = (msg) => { if(!isSilent) newLogs.push(msg); };

        const allySkillPool = buildSkillPool(ally.heroes); const enemySkillPool = buildSkillPool(enemy.heroes);

        if (currentTurn === 1) {
            allySkillPool.filter(s => s.timing === 'always').forEach(s => ally.activeBuffs.push({ ...s, remain: 999 }));
            enemySkillPool.filter(s => s.timing === 'always').forEach(s => enemy.activeBuffs.push({ ...s, remain: 999 }));
        }

        const allyMiaSkill3s = allySkillPool.filter(s => s.timing === 'mia_turn_prob_40');
        if (allyMiaSkill3s.length > 0 && Math.random() < 0.40) {
            allyMiaSkill3s.forEach(s => { ally.activeBuffs.push({ ...s, remain: 1 }); recordHeroSkill(ally, s, logger, isSilent, true); });
        }
        const enemyMiaSkill3s = enemySkillPool.filter(s => s.timing === 'mia_turn_prob_40');
        if (enemyMiaSkill3s.length > 0 && Math.random() < 0.40) {
            enemyMiaSkill3s.forEach(s => { enemy.activeBuffs.push({ ...s, remain: 1 }); recordHeroSkill(enemy, s, logger, isSilent, true); });
        }

        if (ally.spear.troops > 0 && ally.spear.tier === 11) {
            if (enemy.bow.troops > 0 && Math.random() < 0.20) { 
                ally.spear.kisyuActiveThisTurn = true; 
                ally.stats.kisyuCount++; 
                if(!isSilent) logger(`🎲 [兵士スキル] 味方槍兵【奇襲】ターゲットを敵弓兵に固定。`); 
            }
            else ally.spear.kisyuActiveThisTurn = false;
        } else ally.spear.kisyuActiveThisTurn = false;

        if (enemy.spear.troops > 0 && enemy.spear.tier === 11) {
            if (ally.bow.troops > 0 && Math.random() < 0.20) { 
                enemy.spear.kisyuActiveThisTurn = true; 
                enemy.stats.kisyuCount++; 
                if(!isSilent) logger(`🎲 [兵士スキル] 敵槍兵【奇襲】ターゲットを味方弓兵に固定。`); 
            }
            else enemy.spear.kisyuActiveThisTurn = false;
        } else enemy.spear.kisyuActiveThisTurn = false;

        ['turn_3n', 'turn_4n', 'turn_5n'].forEach(timing => {
            const n = parseInt(timing.split('_')[1]);
            const allyEffTurn = currentTurn - (ally.stunTurnOffset || 0);
            const enemyEffTurn = currentTurn - (enemy.stunTurnOffset || 0);
            if (allyEffTurn > 0 && allyEffTurn % n === 0) triggerBuffs(ally, allySkillPool, timing, logger, "味方", isSilent);
            if (enemyEffTurn > 0 && enemyEffTurn % n === 0) triggerBuffs(enemy, enemySkillPool, timing, logger, "敵", isSilent);
        });

        const allyEffTurn3 = currentTurn - (ally.stunTurnOffset || 0);
        const enemyEffTurn3 = currentTurn - (enemy.stunTurnOffset || 0);
        if (allyEffTurn3 >= 3 && (allyEffTurn3 % 2 === 1)) triggerBuffs(ally, allySkillPool, 'spear_rene_timing', logger, "味方", isSilent);
        if (enemyEffTurn3 >= 3 && (enemyEffTurn3 % 2 === 1)) triggerBuffs(enemy, enemySkillPool, 'spear_rene_timing', logger, "敵", isSilent);

        const getActivePhases = (army) => { const a = []; if (army.shield.troops>0) a.push('shield'); if (army.spear.troops>0) a.push('spear'); if (army.bow.troops>0) a.push('bow'); return a; };
        const allyPhases = getActivePhases(ally); const enemyPhases = getActivePhases(enemy);
        const maxActivePhases = Math.max(allyPhases.length, enemyPhases.length);
        
        const turnAllyTargetNormal = getTarget(enemy); 
        const turnEnemyTargetNormal = getTarget(ally);

        let allySpearAttackedThisTurn = false, allySpearEvenAttackOccurred = false; let enemySpearAttackedThisTurn = false, enemySpearEvenAttackOccurred = false;

        for (let i = 0; i < maxActivePhases; i++) {
            const atkTypeAlly = allyPhases[i]; const atkTypeEnemy = enemyPhases[i];
            if (!atkTypeAlly && !atkTypeEnemy) continue;
            if(!isSilent) logger(`--- [優先度フェーズ ${["Ⅰ", "Ⅱ", "Ⅲ"][i] || i+1}] ---`);

            let killsToEnemy = 0, killsToAlly = 0;
            let applyAllyStunToEnemy = false, applyEnemyStunToAlly = false;

            // ミアⅠ（敵被ダメ上昇）: フェーズ開始時に毎フェーズ抽選し、通常攻撃・ヘンドリックⅢ全体攻撃に引き継ぐ
            let allyResolvedMiaOppDefDown = 0;
            if (currentTurn >= 2) {
                const miaSkill1s = allySkillPool.filter(s => s.timing === 'mia_atk_prob_50');
                if (miaSkill1s.length > 0 && Math.random() < 0.50) {
                    miaSkill1s.forEach(s => { allyResolvedMiaOppDefDown += s.value; recordHeroSkill(ally, s, logger, isSilent, true); });
                }
            }
            let enemyResolvedMiaOppDefDown = 0;
            if (currentTurn >= 2) {
                const miaSkill1sE = enemySkillPool.filter(s => s.timing === 'mia_atk_prob_50');
                if (miaSkill1sE.length > 0 && Math.random() < 0.50) {
                    miaSkill1sE.forEach(s => { enemyResolvedMiaOppDefDown += s.value; recordHeroSkill(enemy, s, logger, isSilent, true); });
                }
            }

            if (atkTypeAlly && ally[atkTypeAlly].troops > 0) {
                if (ally[atkTypeAlly].stunned) {
                    if(!isSilent) logger(`🌀 [味方 ${atkTypeAlly}] は行動不能（スタン中）のため、攻撃をパスしました。`);
                    ally[atkTypeAlly].stunned = false;
                    ally.stunTurnOffset = (ally.stunTurnOffset || 0) + 1; 
                } else {
                    const finalAllyTarget = (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) ? 'bow' : turnAllyTargetNormal;
                    if (finalAllyTarget && enemy[finalAllyTarget].troops > 0) {
                        const isEvenAttack = (atkTypeAlly === 'spear' && (ally.spearAttackCount + 1) % 2 === 0);
                        const result = calculateDamageSplit(atkTypeAlly, finalAllyTarget, ally, enemy, fixedMinTroopsSetting, logger, currentTurn, isEvenAttack, allySkillPool, false, isSilent, allyResolvedMiaOppDefDown);
                        killsToEnemy = result.totalKills;
                        applyAllyStunToEnemy = result.hasStunApplied;
                        if(!isSilent) {
                            logger(`▶ [味方 ${atkTypeAlly}] ➔ [敵 ${finalAllyTarget}] へ攻撃`);
                            if (result.detailLog) logger(result.detailLog);
                            logger(`   💥 最終撃破: ${killsToEnemy.toLocaleString()}人`);
                        }
                    } else {
                        if (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) {
                            if(!isSilent) logger(`▶ [味方 槍兵] ➔ [敵 bow] 🎯 奇襲を試みましたが、敵に弓兵が生存していないため「空振り」しました。`);
                        } else {
                            if(!isSilent) logger(`▶ [味方 ${atkTypeAlly}] ➔ [敵 ${finalAllyTarget || 'なし'}] ターゲットが全滅しているため「空振り」しました。`);
                        }
                    }
                    if (atkTypeAlly === 'shield') triggerBuffs(ally, allySkillPool, 'after_shield_attack', logger, "味方", isSilent);
                    if (atkTypeAlly === 'spear') { allySpearAttackedThisTurn = true; ally.spearAttackCount++; if (ally.spearAttackCount % 2 === 0) allySpearEvenAttackOccurred = true; }
                    
                    if (atkTypeAlly === 'bow' && (currentTurn - (ally.stunTurnOffset||0)) % 3 === 0 && (currentTurn - (ally.stunTurnOffset||0)) > 0 && allySkillPool.some(s => s.category === 'Hendrick3')) {
                        const hendrickSkills = allySkillPool.filter(s => s.category === 'Hendrick3');
                        if(hendrickSkills.length > 0) {
                            recordHeroSkill(ally, hendrickSkills[0], logger, isSilent, true);
                            ['shield', 'spear', 'bow'].forEach(oppType => {
                                if (enemy[oppType].troops > 0) {
                                    const hResult = calculateDamageSplit('bow', oppType, ally, enemy, fixedMinTroopsSetting, logger, currentTurn, false, allySkillPool, true, isSilent, allyResolvedMiaOppDefDown);
                                    enemy[oppType].troops = Math.max(0, enemy[oppType].troops - hResult.totalKills);
                                    if(!isSilent) {
                                        logger(`  ▶ [味方 bow] ➔ [敵 ${oppType}] へ追加狙撃`);
                                        if (hResult.detailLog) logger(hResult.detailLog);
                                        logger(`     💥 追加撃破: ${hResult.totalKills.toLocaleString()}人`);
                                    }
                                }
                            });
                        }
                    }
                }
            }

            if (atkTypeEnemy && enemy[atkTypeEnemy].troops > 0) {
                if (enemy[atkTypeEnemy].stunned) {
                    if(!isSilent) logger(`🌀 [敵 ${atkTypeEnemy}] は行動不能（スタン中）のため、攻撃をパスしました。`);
                    enemy[atkTypeEnemy].stunned = false;
                    enemy.stunTurnOffset = (enemy.stunTurnOffset || 0) + 1; 
                } else {
                    const finalEnemyTarget = (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) ? 'bow' : turnEnemyTargetNormal;
                    if (finalEnemyTarget && ally[finalEnemyTarget].troops > 0) {
                        const isEvenAttack = (atkTypeEnemy === 'spear' && (enemy.spearAttackCount + 1) % 2 === 0);
                        const result = calculateDamageSplit(atkTypeEnemy, finalEnemyTarget, enemy, ally, fixedMinTroopsSetting, logger, currentTurn, isEvenAttack, enemySkillPool, false, isSilent, enemyResolvedMiaOppDefDown);
                        killsToAlly = result.totalKills;
                        applyEnemyStunToAlly = result.hasStunApplied;
                        if(!isSilent) {
                            logger(`▶ [敵 ${atkTypeEnemy}] ➔ [味方 ${finalEnemyTarget}] へ攻撃`);
                            if (result.detailLog) logger(result.detailLog);
                            logger(`   💥 最終撃破: ${killsToAlly.toLocaleString()}人`);
                        }
                    } else {
                        if (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) {
                            if(!isSilent) logger(`▶ [敵 槍兵] ➔ [味方 bow] 🎯 奇襲を試みましたが、味方に弓兵が生存していないため「空振り」しました。`);
                        } else {
                            if(!isSilent) logger(`▶ [敵 ${atkTypeEnemy}] ➔ [味方 ${finalEnemyTarget || 'なし'}] ターゲットが全滅しているため「空振り」しました。`);
                        }
                    }
                    if (atkTypeEnemy === 'shield') triggerBuffs(enemy, enemySkillPool, 'after_shield_attack', logger, "敵", isSilent);
                    if (atkTypeEnemy === 'spear') { enemySpearAttackedThisTurn = true; enemy.spearAttackCount++; if (enemy.spearAttackCount % 2 === 0) enemySpearEvenAttackOccurred = true; }
                    
                    if (atkTypeEnemy === 'bow' && (currentTurn - (enemy.stunTurnOffset||0)) % 3 === 0 && (currentTurn - (enemy.stunTurnOffset||0)) > 0 && enemySkillPool.some(s => s.category === 'Hendrick3')) {
                        const hendrickSkills = enemySkillPool.filter(s => s.category === 'Hendrick3');
                        if(hendrickSkills.length > 0) {
                            recordHeroSkill(enemy, hendrickSkills[0], logger, isSilent, true);
                            ['shield', 'spear', 'bow'].forEach(oppType => {
                                if (ally[oppType].troops > 0) {
                                    const hResult = calculateDamageSplit('bow', oppType, enemy, ally, fixedMinTroopsSetting, logger, currentTurn, false, enemySkillPool, true, isSilent, enemyResolvedMiaOppDefDown);
                                    ally[oppType].troops = Math.max(0, ally[oppType].troops - hResult.totalKills);
                                    if(!isSilent) {
                                        logger(`  ▶ [敵 bow] ➔ [味方 ${oppType}] へ追加狙撃`);
                                        if (hResult.detailLog) logger(hResult.detailLog);
                                        logger(`     💥 追加撃破: ${hResult.totalKills.toLocaleString()}人`);
                                    }
                                }
                            });
                        }
                    }
                }
            }

            if (killsToEnemy > 0 && turnAllyTargetNormal) {
                const t = (atkTypeAlly === 'spear' && ally.spear.kisyuActiveThisTurn) ? 'bow' : turnAllyTargetNormal;
                if (enemy[t]) {
                    enemy[t].troops = Math.max(0, enemy[t].troops - killsToEnemy);
                    if (applyAllyStunToEnemy) { enemy[t].stunned = true; if(!isSilent) logger(`🌀 [ソニヤ効果] 敵の ${t} を次ターン「行動不能」にしました！`); }
                }
            }
            if (killsToAlly > 0 && turnEnemyTargetNormal) {
                const t = (atkTypeEnemy === 'spear' && enemy.spear.kisyuActiveThisTurn) ? 'bow' : turnEnemyTargetNormal;
                if (ally[t]) {
                    ally[t].troops = Math.max(0, ally[t].troops - killsToAlly);
                    if (applyEnemyStunToAlly) { ally[t].stunned = true; if(!isSilent) logger(`🌀 [ソニヤ効果] 味方の ${t} を次ターン「行動不能」にしました！`); }
                }
            }
            if (getTotalTroops(ally) === 0 || getTotalTroops(enemy) === 0) break;
        }

        const updateSpearActionBuffs = (army, skillPool, spearAttacked, evenOccurred, target, sideName) => {
            if (spearAttacked) {
                army.activeBuffs = army.activeBuffs.filter(b => { if (b.isSpearActionBuff) return false; return true; });
                if (evenOccurred) {
                    skillPool.forEach(skill => {
                        if (skill.timing === 'spear_even_attack_after') { const actualTarget = army.spear.kisyuActiveThisTurn ? 'bow' : target; army.activeBuffs.push({ ...skill, isSpearActionBuff: true, attackedTarget: actualTarget, remain: 999 }); recordHeroSkill(army, skill, logger, isSilent, true); }
                    });
                }
            }
        };
        updateSpearActionBuffs(ally, allySkillPool, allySpearAttackedThisTurn, allySpearEvenAttackOccurred, turnAllyTargetNormal, "味方");
        updateSpearActionBuffs(enemy, enemySkillPool, enemySpearAttackedThisTurn, enemySpearEvenAttackOccurred, turnEnemyTargetNormal, "敵");

        const processDuration = (army) => {
            const nextBuffs = [];
            army.activeBuffs.forEach(b => {
                if (b.remain > 900 || b.isSpearActionBuff) { nextBuffs.push(b); return; } 
                b.remain -= 1; if (b.remain > 0) nextBuffs.push(b);
            });
            army.activeBuffs = nextBuffs;
        };
        processDuration(ally); processDuration(enemy);

        if(!isSilent) logger(`[ターン終了] 味方:${getTotalTroops(ally).toLocaleString()} / 敵:${getTotalTroops(enemy).toLocaleString()}`);
        return { newArmyData: { ally, enemy }, newLogs };
    };

    const executeBattle = (singleTurn = false) => {
        let currentArmyData = JSON.parse(JSON.stringify(armyData));
        let currentTurn = turn;
        let accumulatedLogs = [];
        let allyTotal = getTotalTroops(currentArmyData.ally);
        let enemyTotal = getTotalTroops(currentArmyData.enemy);
        
        let currentMinTroops = fixedMinTroops;
        if (currentTurn === 0) {
            currentMinTroops = Math.min(allyTotal, enemyTotal);
            setFixedMinTroops(currentMinTroops);
            accumulatedLogs.push(`[システム] 開始時最小部隊数 ${currentMinTroops.toLocaleString()}人を固定適用。`);
        }

        const MAX_TURNS = singleTurn ? currentTurn + 1 : 1000;
        while (allyTotal > 0 && enemyTotal > 0 && currentTurn < MAX_TURNS) {
            currentTurn++;
            const result = processOneTurn(currentArmyData, currentTurn, currentMinTroops, false);
            currentArmyData = result.newArmyData;
            accumulatedLogs.push(...result.newLogs);
            allyTotal = getTotalTroops(currentArmyData.ally);
            enemyTotal = getTotalTroops(currentArmyData.enemy);
        }

        if (!singleTurn || allyTotal === 0 || enemyTotal === 0) {
            if (allyTotal === 0 && enemyTotal === 0) accumulatedLogs.push("★引き分け！");
            else if (allyTotal === 0) accumulatedLogs.push("★敵軍の勝利！");
            else if (enemyTotal === 0) accumulatedLogs.push("★味方軍の勝利！");
        }

        setArmyData(currentArmyData);
        setLogs(prev => [...prev, ...accumulatedLogs]);
        setTurn(currentTurn);
    };

    const executeMonteCarlo = () => {
        const TIMES = 1000;
        const initialArmyData = JSON.parse(JSON.stringify(armyData));
        const results = [];
        let minTroops = Math.min(getTotalTroops(initialArmyData.ally), getTotalTroops(initialArmyData.enemy));

        for (let i = 0; i < TIMES; i++) {
            let currentArmyData = JSON.parse(JSON.stringify(initialArmyData));
            let currentTurn = 0;
            let allyTotal = getTotalTroops(currentArmyData.ally);
            let enemyTotal = getTotalTroops(currentArmyData.enemy);

            while (allyTotal > 0 && enemyTotal > 0 && currentTurn < 1000) {
                currentTurn++;
                const { newArmyData } = processOneTurn(currentArmyData, currentTurn, minTroops, true);
                currentArmyData = newArmyData;
                allyTotal = getTotalTroops(currentArmyData.ally);
                enemyTotal = getTotalTroops(currentArmyData.enemy);
            }
            results.push({ winner: allyTotal > 0 && enemyTotal === 0 ? 'ally' : (enemyTotal > 0 && allyTotal === 0 ? 'enemy' : 'draw'), allySurviving: allyTotal, enemySurviving: enemyTotal });
        }
        setSimResults(results);
    };

    const isHeroInArmy = (army, heroKey) => {
        return Object.values(army.heroes).includes(heroKey);
    };

    const isGameOver = turn > 0 && (getTotalTroops(armyData.ally) === 0 || getTotalTroops(armyData.enemy) === 0);
    const allyWinResults = simResults ? simResults.filter(r => r.winner === 'ally').map(r => r.allySurviving) : [];
    const enemyWinResults = simResults ? simResults.filter(r => r.winner === 'enemy').map(r => r.enemySurviving) : [];
    const allyStats = calcStats(allyWinResults);
    const enemyStats = calcStats(enemyWinResults);

    return (
        <div className="max-w-7xl mx-auto p-4 min-h-screen animate-fade-in relative">
            {showEditor && <SkillTestEditorModal currentDB={heroDB} onSave={handleSaveHeroDB} onClose={() => setShowEditor(false)} />}

            <header className="mb-4 text-center flex flex-col items-center gap-3">
                <h1 className="text-3xl font-black text-slate-800">WOS戦闘シミュレーター</h1>
                <div className="flex flex-wrap justify-center items-center gap-2">
                    <p className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded font-bold shadow-sm border border-indigo-200">
                        ⚔️ UI・ログ最適化 V39 ⚔️
                    </p>
                    <button onClick={() => setShowDict(!showDict)} className="text-sm bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded font-bold shadow-sm transition flex items-center gap-1 border border-amber-300">
                        {showDict ? '🔼 辞典を閉じる' : '📚 スキル重複辞典を開く'}
                    </button>
                    <button onClick={() => setShowEditor(true)} className="text-sm bg-slate-800 text-white hover:bg-slate-700 px-3 py-1.5 rounded font-bold transition shadow-sm ml-1">
                        ⚙️ エディタ
                    </button>
                </div>
            </header>

            {showDict && <InlineSkillDictionary heroDB={heroDB} />}

            <div className="flex flex-col lg:flex-row gap-4">
                <ArmyPanel side="ally" title="味方軍" army={armyData.ally} bgColor="bg-blue-50/50" borderColor="border-blue-500" titleColor="text-blue-700" turn={turn} onHeroChange={handleHeroChange} onUnitChange={handleUnitChange} heroDB={heroDB} />
                
                <div className="w-full lg:w-1/3 flex flex-col gap-3 lg:h-auto lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4">
                    <div className="flex bg-slate-200 p-1 rounded-lg shrink-0">
                        <button onClick={() => setActiveTab('single')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}>📝 1回テスト (詳細ログ)</button>
                        <button onClick={() => setActiveTab('montecarlo')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'montecarlo' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}>📊 1000回テスト (最強分析)</button>
                        <button onClick={handleReset} className="flex-1 py-1.5 text-xs font-bold bg-slate-400 text-white hover:bg-slate-500 rounded-md transition shadow-sm ml-1">🔄 初期化</button>
                    </div>

                    {activeTab === 'single' && (
                        <>
                            <div className="bg-white p-3 rounded-xl shadow-md flex flex-col gap-2 shrink-0">
                                <button onClick={() => executeBattle(true)} disabled={isGameOver} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded transition active:scale-95 text-sm">1ターン進める</button>
                                <button onClick={() => executeBattle(false)} disabled={isGameOver} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition active:scale-95 text-sm">一気に結果を見る</button>
                            </div>

                            {/* 🌟 V39: 英雄スキル名がシンプル（英雄名＋Ⅰ,Ⅱ,Ⅲ）に表示される */}
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md shrink-0 border border-slate-700">
                                <h3 className="font-bold text-pink-400 mb-2 text-[11px] border-b border-slate-700 pb-1 flex items-center justify-between">
                                    <span>🎲 スキル発動回数 (Turn {turn})</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[10px] leading-tight">
                                    <div>
                                        <p className="text-blue-400 font-bold mb-1 border-b border-slate-700 pb-0.5">【味方 兵士】</p>
                                        {armyData.ally.shield.tier === 11 && <div className="text-slate-300">🛡️ 烈晶盾: <span className="font-bold text-white">{armyData.ally.stats.resshoCount}回</span></div>}
                                        {armyData.ally.spear.tier === 11 && (
                                            <>
                                                <div className="text-slate-300">🗡️ 奇襲: <span className="font-bold text-amber-300">{armyData.ally.stats.kisyuCount}回</span></div>
                                                <div className="text-slate-300">🗡️ 炎晶戦矛: <span className="font-bold text-white">{armyData.ally.stats.enshoCount}回</span></div>
                                                <div className="text-slate-300">🗡️ 熾烈領域: <span className="font-bold text-white">{armyData.ally.stats.shiretsuCount}回</span></div>
                                            </>
                                        )}
                                        {armyData.ally.bow.tier === 11 && (
                                            <>
                                                <div className="text-slate-300">🏹 連射: <span className="font-bold text-white">{armyData.ally.stats.renshaCount}回</span></div>
                                                <div className="text-slate-300">🏹 燃晶火薬: <span className="font-bold text-white">{armyData.ally.stats.nenshoCount}回</span></div>
                                            </>
                                        )}
                                        
                                        {Object.keys(armyData.ally.stats.heroSkillCounts).length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-blue-400 font-bold mb-1 border-b border-slate-700 pb-0.5">【味方 英雄】</p>
                                                {Object.values(armyData.ally.stats.heroSkillCounts).map((s, idx) => (
                                                    <div key={idx} className="text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis">✨ {s.name}: <span className="font-bold text-teal-300">{s.count}回</span></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-red-400 font-bold mb-1 border-b border-slate-700 pb-0.5">【敵 兵士】</p>
                                        {armyData.enemy.shield.tier === 11 && <div className="text-slate-300">🛡️ 烈晶盾: <span className="font-bold text-white">{armyData.enemy.stats.resshoCount}回</span></div>}
                                        {armyData.enemy.spear.tier === 11 && (
                                            <>
                                                <div className="text-slate-300">🗡️ 奇襲: <span className="font-bold text-amber-300">{armyData.enemy.stats.kisyuCount}回</span></div>
                                                <div className="text-slate-300">🗡️ 炎晶戦矛: <span className="font-bold text-white">{armyData.enemy.stats.enshoCount}回</span></div>
                                                <div className="text-slate-300">🗡️ 熾烈領域: <span className="font-bold text-white">{armyData.enemy.stats.shiretsuCount}回</span></div>
                                            </>
                                        )}
                                        {armyData.enemy.bow.tier === 11 && (
                                            <>
                                                <div className="text-slate-300">🏹 連射: <span className="font-bold text-white">{armyData.enemy.stats.renshaCount}回</span></div>
                                                <div className="text-slate-300">🏹 燃晶火薬: <span className="font-bold text-white">{armyData.enemy.stats.nenshoCount}回</span></div>
                                            </>
                                        )}

                                        {Object.keys(armyData.enemy.stats.heroSkillCounts).length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-red-400 font-bold mb-1 border-b border-slate-700 pb-0.5">【敵 英雄】</p>
                                                {Object.values(armyData.enemy.stats.heroSkillCounts).map((s, idx) => (
                                                    <div key={idx} className="text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis">✨ {s.name}: <span className="font-bold text-teal-300">{s.count}回</span></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-3 rounded-xl shadow-md flex flex-col min-h-[400px] lg:flex-1 lg:min-h-0">
                                <h3 className="font-bold text-slate-700 mb-1 text-xs border-b pb-1 shrink-0">詳細戦闘ログ</h3>
                                <div ref={logContainerRef} className="border border-slate-800 rounded bg-slate-950 flex-1 overflow-y-auto p-2 text-[10px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                                    {logs.length === 0 && <p className="text-slate-500 text-center mt-4">ボタンを押して開始してください。</p>}
                                    {logs.map((log, i) => (
                                        <div key={i} className={`mb-1 ${
                                            log.includes('✨') ? 'text-yellow-300 font-bold bg-yellow-900/30 px-1 rounded' :
                                            log.includes('🛡️') ? 'text-emerald-400 font-bold' :
                                            log.includes('🌀') ? 'text-purple-400 font-bold' :
                                            log.includes('⚡') ? 'text-orange-400 font-bold bg-orange-950/20 px-1 rounded' :
                                            log.includes('🎲') ? 'text-pink-300 font-bold bg-pink-950/40 px-1 rounded' :
                                            log.includes('空振り') ? 'text-pink-400 font-bold bg-pink-900/10' :
                                            log.includes('▶ [味方') ? 'text-blue-400 font-bold' : 
                                            log.includes('▶ [敵') ? 'text-red-400 font-bold' : 
                                            log.includes('💥') ? 'text-yellow-400 font-bold ml-2' : 
                                            log.includes('====') ? 'text-white mt-3 font-bold border-b border-slate-600 bg-slate-900/50 p-1' : 
                                            log.includes('┣') || log.includes('┃') || log.includes('┗') || log.includes('通常Mod:') || log.includes('追加Mod:') || log.includes('通常:') || log.includes('追加:') ? 'text-slate-400' : 
                                            'text-slate-300'}`}>{log}</div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'montecarlo' && (
                        <div className="bg-white p-3 rounded-xl shadow-md flex flex-col gap-4 min-h-[400px] lg:flex-1 lg:min-h-0 overflow-y-auto">
                            <button onClick={executeMonteCarlo} disabled={turn > 0} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.5)] transition active:scale-95 disabled:bg-slate-400 disabled:shadow-none text-sm flex items-center justify-center gap-2">
                                🚀 1000回シミュレーション実行
                            </button>
                            {turn > 0 && <p className="text-[10px] text-red-500 text-center font-bold">※テストを行うには、初期化ボタンでTurn0に戻してください。</p>}

                            {simResults && (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <h3 className="font-bold text-slate-700 text-xs text-center mb-2">🏆 勝率データ (1,000戦中)</h3>
                                        <WinRateChart results={simResults} />
                                        <div className="flex justify-center gap-4 mt-2 text-xs font-bold">
                                            <span className="text-blue-600">味方: {simResults.filter(r=>r.winner==='ally').length}勝</span>
                                            <span className="text-red-600">敵: {simResults.filter(r=>r.winner==='enemy').length}勝</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm">
                                        <h3 className="font-bold text-blue-800 text-xs text-center mb-1">🟦 味方勝利時の「残り兵力」分析</h3>
                                        {allyWinResults.length > 0 ? (
                                            <>
                                                <div className="flex flex-col gap-1 text-[11px] mb-2 px-2 text-blue-900 bg-white border border-blue-100 rounded py-1.5 font-bold shadow-inner">
                                                    <div className="flex justify-between border-b border-blue-50 pb-1">
                                                        <span>🎯 期待値(平均): <span className="text-blue-600 text-sm">{allyStats.mean.toLocaleString()}人</span></span>
                                                        <span>安定度(中央): <span className="text-blue-500">{allyStats.median.toLocaleString()}人</span></span>
                                                    </div>
                                                    <div className="text-right text-[9px] text-blue-400">
                                                        ブレ幅(σ): ±{allyStats.stdDev.toLocaleString()}
                                                    </div>
                                                </div>
                                                <HistogramChart data={allyWinResults} color="#3b82f6" label="味方生存数" />
                                            </>
                                        ) : <p className="text-center text-xs text-slate-500 py-4">味方の勝利データなし</p>}
                                    </div>

                                    <div className="bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm">
                                        <h3 className="font-bold text-red-800 text-xs text-center mb-1">🟥 敵勝利時の「残り兵力」分析</h3>
                                        {enemyWinResults.length > 0 ? (
                                            <>
                                                <div className="flex flex-col gap-1 text-[11px] mb-2 px-2 text-red-900 bg-white border border-red-100 rounded py-1.5 font-bold shadow-inner">
                                                    <div className="flex justify-between border-b border-red-50 pb-1">
                                                        <span>🎯 期待値(平均): <span className="text-red-600 text-sm">{enemyStats.mean.toLocaleString()}人</span></span>
                                                        <span>安定度(中央): <span className="text-red-500">{enemyStats.median.toLocaleString()}人</span></span>
                                                    </div>
                                                    <div className="text-right text-[9px] text-red-400">
                                                        ブレ幅(σ): ±{enemyStats.stdDev.toLocaleString()}
                                                    </div>
                                                </div>
                                                <HistogramChart data={enemyWinResults} color="#ef4444" label="敵生存数" />
                                            </>
                                        ) : <p className="text-center text-xs text-slate-500 py-4">敵の勝利データなし</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <ArmyPanel side="enemy" title="敵軍" army={armyData.enemy} bgColor="bg-red-50/50" borderColor="border-red-500" titleColor="text-red-700" turn={turn} onHeroChange={handleHeroChange} onUnitChange={handleUnitChange} heroDB={heroDB} />
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);