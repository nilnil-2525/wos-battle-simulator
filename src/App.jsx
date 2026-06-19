import React, { useState, useEffect, useRef } from 'react';
import { WinRateChart, HistogramChart } from './components/Charts.jsx';
import { ArmyPanel } from './components/ArmyPanel.jsx';
import { InlineSkillDictionary } from './components/InlineSkillDictionary.jsx';
import { SkillTestEditorModal } from './components/SkillTestEditorModal.jsx';
import {
    applyBattleGameData,
    initialArmyState,
    createInitialStats,
    MAX_BATTLE_TURNS,
    MONTE_CARLO_RUNS,
    calcStats,
    getTotalTroops,
    processOneTurn
} from './utils/battleSimulator.js';

export let INITIAL_HERO_DB = {};

export const applyGameData = (data) => {
    if (!data || !data.baseStatsData || !data.initialHeroDB) {
        throw new Error('game-data に baseStatsData と initialHeroDB が必要です。');
    }
    INITIAL_HERO_DB = data.initialHeroDB;
    applyBattleGameData(data);
};

const App = () => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('theme') || 'dark';
        } catch (e) {
            return 'dark';
        }
    });
    const [heroDB, setHeroDB] = useState(JSON.parse(JSON.stringify(INITIAL_HERO_DB)));
    const [armyData, setArmyData] = useState({ 
        ally: JSON.parse(JSON.stringify(initialArmyState)), 
        enemy: JSON.parse(JSON.stringify(initialArmyState)) 
    });
    const [heroPresets, setHeroPresets] = useState(() => {
        try {
            const saved = localStorage.getItem('wos_hero_presets');
            return saved ? JSON.parse(saved) : { 1: null, 2: null, 3: null, 4: null, 5: null };
        } catch (e) {
            return { 1: null, 2: null, 3: null, 4: null, 5: null };
        }
    });
    const [unitPresets, setUnitPresets] = useState(() => {
        const defaultPresets = {
            shield: { 1: null, 2: null, 3: null, 4: null, 5: null },
            spear: { 1: null, 2: null, 3: null, 4: null, 5: null },
            bow: { 1: null, 2: null, 3: null, 4: null, 5: null }
        };
        try {
            const saved = localStorage.getItem('wos_unit_presets');
            return saved ? JSON.parse(saved) : defaultPresets;
        } catch (e) {
            return defaultPresets;
        }
    });
    const [logs, setLogs] = useState([]);
    const [turn, setTurn] = useState(0);
    const [fixedMinTroops, setFixedMinTroops] = useState(0);

    const handleLoadHeroPreset = (side, presetHeroes) => {
        if (!presetHeroes) return;
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            newData[side].heroes = JSON.parse(JSON.stringify(presetHeroes));
            return newData;
        });
    };

    const handleSaveHeroPreset = (slot, heroes) => {
        setHeroPresets(prev => {
            const newPresets = { ...prev, [slot]: heroes ? JSON.parse(JSON.stringify(heroes)) : null };
            localStorage.setItem('wos_hero_presets', JSON.stringify(newPresets));
            return newPresets;
        });
    };

    const handleLoadUnitPreset = (side, type, presetUnit) => {
        if (!presetUnit) return;
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            newData[side][type].tier = presetUnit.tier;
            newData[side][type].initialTroops = presetUnit.initialTroops;
            newData[side][type].troops = presetUnit.initialTroops;
            newData[side][type].buffs = JSON.parse(JSON.stringify(presetUnit.buffs));
            return newData;
        });
    };

    const handleSaveUnitPreset = (type, slot, unitData) => {
        setUnitPresets(prev => {
            const newPresets = JSON.parse(JSON.stringify(prev));
            newPresets[type][slot] = unitData ? {
                tier: unitData.tier,
                initialTroops: unitData.initialTroops,
                buffs: JSON.parse(JSON.stringify(unitData.buffs))
            } : null;
            localStorage.setItem('wos_unit_presets', JSON.stringify(newPresets));
            return newPresets;
        });
    };
    
    const [activeTab, setActiveTab] = useState('single');
    const [simResults, setSimResults] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simProgress, setSimProgress] = useState(0);
    const [showDict, setShowDict] = useState(false);
    const [showEditor, setShowEditor] = useState(false); 
    
    const logContainerRef = useRef(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            // Ignore storage restrictions
        }
    }, [theme]);

    useEffect(() => { 
        if (logContainerRef.current && activeTab === 'single') {
            const container = logContainerRef.current;
            // 描画更新完了後のタイミングを正確に捉え、瞬時に一番下までスクロール追従させる
            requestAnimationFrame(() => {
                container.scrollTop = container.scrollHeight;
            });
        }
    }, [logs, activeTab]);

    const handleHeroChange = (side, role, heroKey) => {
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            newData[side].heroes[role] = heroKey;
            return newData;
        });
    };

    const handleUnitChange = (side, type, field, value) => {
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            if (field === 'initialTroops') {
                newData[side][type].initialTroops = value;
                newData[side][type].troops = value;
            } else if (field === 'buffs') {
                newData[side][type].buffs = value;
            } else {
                newData[side][type][field] = value;
            }
            return newData;
        });
    };

    const handleReset = () => {
        setArmyData(prev => {
            const newData = JSON.parse(JSON.stringify(prev));
            ['ally', 'enemy'].forEach(side => {
                ['shield', 'spear', 'bow'].forEach(type => {
                    newData[side][type].troops = newData[side][type].initialTroops;
                    newData[side][type].stunned = false;
                });
                newData[side].spearAttackCount = 0;
                newData[side].stunTurnOffset = 0;
                newData[side].activeBuffs = [];
                newData[side].stats = createInitialStats();
            });
            return newData;
        });
        setLogs([]);
        setTurn(0);
        setFixedMinTroops(0);
        setSimResults(null);
    };

    const handleSaveHeroDB = (newDB) => {
        setHeroDB(newDB);
        setShowEditor(false);
        setLogs(prev => [...prev, "==== システム通知 ====", "⚙️ Skill Editorから英雄スキルデータを更新・適用しました！"]);
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

        const MAX_TURNS = singleTurn ? currentTurn + 1 : MAX_BATTLE_TURNS;
        while (allyTotal > 0 && enemyTotal > 0 && currentTurn < MAX_TURNS) {
            currentTurn++;
            const result = processOneTurn(currentArmyData, currentTurn, currentMinTroops, heroDB, false);
            currentArmyData = result.newArmyData;
            accumulatedLogs.push(...result.newLogs);
            allyTotal = getTotalTroops(currentArmyData.ally);
            enemyTotal = getTotalTroops(currentArmyData.enemy);
        }

        if (!singleTurn || allyTotal === 0 || enemyTotal === 0) {
            if (allyTotal === 0 && enemyTotal === 0) accumulatedLogs.push("★引き分け！");
            else if (allyTotal === 0) accumulatedLogs.push("★敵の勝利！");
            else if (enemyTotal === 0) accumulatedLogs.push("★味方の勝利！");
        }

        setArmyData(currentArmyData);
        setLogs(prev => [...prev, ...accumulatedLogs]);
        setTurn(currentTurn);
    };

    const executeMonteCarlo = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimProgress(0);
        setSimResults(null);

        const initialArmyData = JSON.parse(JSON.stringify(armyData));
        const results = [];
        const minTroops = Math.min(getTotalTroops(initialArmyData.ally), getTotalTroops(initialArmyData.enemy));
        
        const CHUNK_SIZE = 50;
        let currentIndex = 0;

        const runChunk = () => {
            const limit = Math.min(currentIndex + CHUNK_SIZE, MONTE_CARLO_RUNS);
            for (let i = currentIndex; i < limit; i++) {
                let currentArmyData = JSON.parse(JSON.stringify(initialArmyData));
                let currentTurn = 0;
                let allyTotal = getTotalTroops(currentArmyData.ally);
                let enemyTotal = getTotalTroops(currentArmyData.enemy);

                while (allyTotal > 0 && enemyTotal > 0 && currentTurn < MAX_BATTLE_TURNS) {
                    currentTurn++;
                    const { newArmyData } = processOneTurn(currentArmyData, currentTurn, minTroops, heroDB, true);
                    currentArmyData = newArmyData;
                    allyTotal = getTotalTroops(currentArmyData.ally);
                    enemyTotal = getTotalTroops(currentArmyData.enemy);
                }
                results.push({
                    winner: allyTotal > 0 && enemyTotal === 0 ? 'ally' : (enemyTotal > 0 && allyTotal === 0 ? 'enemy' : 'draw'),
                    allySurviving: allyTotal,
                    enemySurviving: enemyTotal
                });
            }

            currentIndex = limit;
            const progress = Math.round((currentIndex / MONTE_CARLO_RUNS) * 100);
            setSimProgress(progress);

            if (currentIndex < MONTE_CARLO_RUNS) {
                requestAnimationFrame(runChunk);
            } else {
                setSimResults(results);
                setIsSimulating(false);
            }
        };

        requestAnimationFrame(runChunk);
    };

    const isGameOver = turn > 0 && (getTotalTroops(armyData.ally) === 0 || getTotalTroops(armyData.enemy) === 0);
    const allyWinResults = simResults ? simResults.filter(r => r.winner === 'ally').map(r => r.allySurviving) : [];
    const enemyWinResults = simResults ? simResults.filter(r => r.winner === 'enemy').map(r => r.enemySurviving) : [];
    const allyStats = calcStats(allyWinResults);
    const enemyStats = calcStats(enemyWinResults);

    return (
        <>
            <div className="snow-bg"></div>
            <div className="snow-bg-fast"></div>
            
            {showEditor && (
                <SkillTestEditorModal 
                    currentDB={heroDB} 
                    initialHeroDB={INITIAL_HERO_DB} 
                    onSave={handleSaveHeroDB} 
                    onClose={() => setShowEditor(false)} 
                />
            )}

            <header className="w-full theme-header shadow-lg relative z-20 mb-6">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h1 className="flex items-center gap-2 app-title">
                        ⚔️ WOS Battle Simulator
                    </h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDict(!showDict)} className="text-sm frozen-btn-amber px-4 py-2 rounded-lg font-bold shadow transition flex items-center gap-1">
                            {showDict ? '🔼 Close List' : '📚 Skill List'}
                        </button>
                        <button onClick={() => setShowEditor(true)} className="text-sm frozen-btn-indigo px-4 py-2 rounded-lg font-bold transition shadow">
                            ⚙️ Skill Editor
                        </button>
                        <button onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} className={`text-sm px-3 py-2 rounded-lg font-bold transition shadow flex items-center gap-1 ${theme === 'dark' ? 'frozen-btn-indigo' : 'frozen-btn-amber'}`}>
                            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 pb-4 min-h-screen animate-fade-in relative z-10">
                {showDict && <InlineSkillDictionary heroDB={heroDB} onClose={() => setShowDict(false)} />}

                <div className="flex flex-col lg:flex-row gap-4">
                    <ArmyPanel 
                        side="ally" 
                        title="味方" 
                        army={armyData.ally} 
                        bgColor="" 
                        borderColor="border-sky-500" 
                        titleColor="" 
                        turn={turn} 
                        onHeroChange={handleHeroChange} 
                        onUnitChange={handleUnitChange} 
                        heroDB={heroDB} 
                        heroPresets={heroPresets}
                        onLoadHeroPreset={handleLoadHeroPreset}
                        onSaveHeroPreset={handleSaveHeroPreset}
                        unitPresets={unitPresets}
                        onLoadUnitPreset={handleLoadUnitPreset}
                        onSaveUnitPreset={handleSaveUnitPreset}
                    />
                    
                    <div className="w-full lg:w-1/3 flex flex-col gap-3 lg:h-auto lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4">
                        <div className="flex theme-tab-container p-1 rounded-full shrink-0">
                            <button onClick={() => setActiveTab('single')} className={`flex-1 py-1.5 text-[11px] font-bold rounded-full transition ${activeTab === 'single' ? 'theme-tab-btn-active' : 'theme-tab-btn-inactive'}`}>📝 詳細ログ検証 (1回)</button>
                            <button onClick={() => setActiveTab('montecarlo')} className={`flex-1 py-1.5 text-[11px] font-bold rounded-full transition ${activeTab === 'montecarlo' ? 'theme-tab-btn-active' : 'theme-tab-btn-inactive'}`}>📊 確率統計分析 (1000回)</button>
                        </div>

                        <div className="flex gap-2 items-center justify-between px-1.5 py-0.5 shrink-0">
                            <span className="text-[11px] theme-text-muted font-mono font-bold">
                                現在の状態: {turn > 0 ? `Turn ${turn} (戦闘中)` : '未戦闘 (初期化済)'}
                            </span>
                            <button 
                                onClick={handleReset} 
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition shadow-sm active:scale-95 flex items-center gap-1 border ${
                                    theme === 'dark' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' 
                                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                }`}
                            >
                                🔄 戦闘リセット
                            </button>
                        </div>

                        {activeTab === 'single' && (
                            <>
                                <div className="ice-panel p-2.5 rounded-xl shadow-md shrink-0 border border-slate-700/10">
                                    <div className="flex gap-2">
                                        <button onClick={() => executeBattle(true)} disabled={isGameOver} className="flex-1 frozen-btn-indigo font-bold py-2 rounded transition active:scale-95 text-xs flex items-center justify-center gap-1">
                                            ⏭️ 1ターン進める
                                        </button>
                                        <button onClick={() => executeBattle(false)} disabled={isGameOver} className="flex-1 frozen-btn-amber font-bold py-2 rounded transition active:scale-95 text-xs flex items-center justify-center gap-1">
                                            ⏩ 戦闘終了まで進める
                                        </button>
                                    </div>
                                </div>

                                <div className="ice-panel p-3 rounded-xl shadow-md shrink-0 border border-slate-700/10">
                                    <h3 className="font-bold text-pink-500 mb-2.5 text-xs border-b border-slate-700/20 pb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1">🎲 スキル発動回数 <span className="text-[10px] font-normal theme-text-muted">(ターン {turn})</span></span>
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-xs leading-normal">
                                        {/* 味方スキルカード */}
                                        <div className="theme-nested-panel p-2.5 rounded-lg border border-slate-700/10 flex flex-col gap-2">
                                            <h4 className="theme-ally-win-text font-bold text-[10.5px] uppercase tracking-wider border-b border-sky-500/20 pb-1 flex justify-between items-center">
                                                <span>味方</span>
                                                <span className="text-[9px] opacity-75 font-mono">ALLY</span>
                                            </h4>
                                            <div className="flex flex-col gap-1.5">
                                                {/* 兵士スキル */}
                                                {armyData.ally.shield.tier === 11 && (
                                                    <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                        <span className="theme-text-muted">🛡️ 烈晶盾</span>
                                                        <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>{armyData.ally.stats.resshoCount}回</span>
                                                    </div>
                                                )}
                                                {armyData.ally.spear.tier === 11 && (
                                                    <>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 奇襲</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.ally.stats.kisyuCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 炎晶戦矛</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.ally.stats.enshoCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 熾烈領域</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.ally.stats.shiretsuCount}回</span>
                                                        </div>
                                                    </>
                                                )}
                                                {armyData.ally.bow.tier === 11 && (
                                                    <>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🏹 連射</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{armyData.ally.stats.renshaCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🏹 燃晶火薬</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{armyData.ally.stats.nenshoCount}回</span>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {/* 英雄スキル */}
                                                {Object.keys(armyData.ally.stats.heroSkillCounts).length > 0 && (
                                                    <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-700/10 pt-1.5">
                                                        {Object.values(armyData.ally.stats.heroSkillCounts).map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                                <span className="theme-text-muted truncate max-w-[70%]" title={s.name}>✨ {s.name}</span>
                                                                <span className={`font-bold ${theme === 'dark' ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>{s.count}回</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* 発動なし時のプレースホルダー */}
                                                {!(armyData.ally.shield.tier === 11) && !(armyData.ally.spear.tier === 11) && !(armyData.ally.bow.tier === 11) && Object.keys(armyData.ally.stats.heroSkillCounts).length === 0 && (
                                                    <div className="text-center py-6 text-[10.5px] theme-text-muted border border-dashed border-slate-700/20 rounded">
                                                        戦闘開始後に表示
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 敵スキルカード */}
                                        <div className="theme-nested-panel p-2.5 rounded-lg border border-slate-700/10 flex flex-col gap-2">
                                            <h4 className="theme-enemy-win-text font-bold text-[10.5px] uppercase tracking-wider border-b border-red-500/20 pb-1 flex justify-between items-center">
                                                <span>敵</span>
                                                <span className="text-[9px] opacity-75 font-mono">ENEMY</span>
                                            </h4>
                                            <div className="flex flex-col gap-1.5">
                                                {/* 兵士スキル */}
                                                {armyData.enemy.shield.tier === 11 && (
                                                    <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                        <span className="theme-text-muted">🛡️ 烈晶盾</span>
                                                        <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>{armyData.enemy.stats.resshoCount}回</span>
                                                    </div>
                                                )}
                                                {armyData.enemy.spear.tier === 11 && (
                                                    <>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 奇襲</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.enemy.stats.kisyuCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 炎晶戦矛</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.enemy.stats.enshoCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🗡️ 熾烈領域</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>{armyData.enemy.stats.shiretsuCount}回</span>
                                                        </div>
                                                    </>
                                                )}
                                                {armyData.enemy.bow.tier === 11 && (
                                                    <>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🏹 連射</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{armyData.enemy.stats.renshaCount}回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                            <span className="theme-text-muted">🏹 燃晶火薬</span>
                                                            <span className={`font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{armyData.enemy.stats.nenshoCount}回</span>
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {/* 英雄スキル */}
                                                {Object.keys(armyData.enemy.stats.heroSkillCounts).length > 0 && (
                                                    <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-700/10 pt-1.5">
                                                        {Object.values(armyData.enemy.stats.heroSkillCounts).map((s, idx) => (
                                                            <div key={idx} className="flex justify-between items-center px-1.5 py-1 rounded bg-slate-900/15 border border-slate-700/5 font-mono text-[11px]">
                                                                <span className="theme-text-muted truncate max-w-[70%]" title={s.name}>✨ {s.name}</span>
                                                                <span className={`font-bold ${theme === 'dark' ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>{s.count}回</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* 発動なし時のプレースホルダー */}
                                                {!(armyData.enemy.shield.tier === 11) && !(armyData.enemy.spear.tier === 11) && !(armyData.enemy.bow.tier === 11) && Object.keys(armyData.enemy.stats.heroSkillCounts).length === 0 && (
                                                    <div className="text-center py-6 text-[10.5px] theme-text-muted border border-dashed border-slate-700/20 rounded">
                                                        戦闘開始後に表示
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ice-panel p-3 rounded-xl shadow-md flex flex-col min-h-[400px] lg:flex-1 lg:min-h-0 border border-slate-700/10">
                                    <h3 className="font-bold mb-1.5 text-xs border-b border-slate-700/20 pb-1.5 shrink-0 flex items-center justify-between">
                                        <span>📋 詳細戦闘ログ</span>
                                        {logs.length > 0 && <span className="text-[10px] theme-text-muted font-mono">{logs.length} 件のログ</span>}
                                    </h3>
                                    <BattleLogs logs={logs} theme={theme} logContainerRef={logContainerRef} />
                                </div>
                            </>
                        )}

                                <button 
                                    onClick={executeMonteCarlo} 
                                    disabled={turn > 0 || isSimulating} 
                                    className="w-full frozen-btn-indigo font-bold py-3 rounded-lg transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                                >
                                    {isSimulating ? `⏳ シミュレーション中... (${simProgress}%)` : '🚀 1000回シミュレーション実行'}
                                </button>
                                {turn > 0 && <p className="text-xs text-red-500 text-center font-bold">※実行するには、上の「戦闘リセット」ボタンで状態をリセットしてください。</p>}

                                {simResults && (
                                    <div className="flex flex-col gap-4 animate-fade-in">
                                        <div className="theme-nested-panel p-3 rounded-lg">
                                            <h3 className="font-bold text-xs text-center mb-2">🏆 勝率データ (1,000戦中)</h3>
                                            <WinRateChart results={simResults} />
                                            <div className="flex justify-center gap-4 mt-2 text-xs font-bold">
                                                <span className="theme-ally-win-text">味方: {simResults.filter(r=>r.winner==='ally').length}勝</span>
                                                <span className="theme-enemy-win-text">敵: {simResults.filter(r=>r.winner==='enemy').length}勝</span>
                                            </div>
                                        </div>

                                        <div className="theme-ally-win-panel p-3 rounded-lg shadow-sm">
                                            <h3 className="font-bold theme-ally-win-text text-xs text-center mb-1">🟦 味方勝利時の「残り兵力」分析</h3>
                                            {allyWinResults.length > 0 ? (
                                                <>
                                                    <div className="flex flex-col gap-1 text-xs mb-2 px-2 theme-ally-win-text theme-log-container rounded py-1.5 font-bold shadow-inner">
                                                        <div className="flex justify-between border-b border-slate-700/10 pb-1">
                                                            <span>🎯 期待値(平均): <span className="theme-ally-win-text text-sm">{allyStats.mean.toLocaleString()}人</span></span>
                                                            <span>安定度(中央): <span className="theme-ally-win-text-sub">{allyStats.median.toLocaleString()}人</span></span>
                                                        </div>
                                                        <div className="text-right text-[11px] theme-ally-win-text-sub">
                                                            ブレ幅(σ): ±{allyStats.stdDev.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <HistogramChart data={allyWinResults} color="#3b82f6" label="味方生存数" />
                                                </>
                                            ) : <p className="text-center text-xs theme-text-muted py-4">味方の勝利データなし</p>}
                                        </div>

                                        <div className="theme-enemy-win-panel p-3 rounded-lg shadow-sm">
                                            <h3 className="font-bold theme-enemy-win-text text-xs text-center mb-1">🟥 敵勝利時の「残り兵力」分析</h3>
                                            {enemyWinResults.length > 0 ? (
                                                <>
                                                    <div className="flex flex-col gap-1 text-xs mb-2 px-2 theme-enemy-win-text theme-log-container rounded py-1.5 font-bold shadow-inner">
                                                        <div className="flex justify-between border-b border-slate-700/10 pb-1">
                                                            <span>🎯 期待値(平均): <span className="theme-enemy-win-text text-sm">{enemyStats.mean.toLocaleString()}人</span></span>
                                                            <span>安定度(中央): <span className="theme-enemy-win-text-sub">{enemyStats.median.toLocaleString()}人</span></span>
                                                        </div>
                                                        <div className="text-right text-[11px] theme-enemy-win-text-sub">
                                                            ブレ幅(σ): ±{enemyStats.stdDev.toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <HistogramChart data={enemyWinResults} color="#ef4444" label="敵生存数" />
                                                </>
                                            ) : <p className="text-center text-xs theme-text-muted py-4">敵の勝利データなし</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <ArmyPanel 
                        side="enemy" 
                        title="敵" 
                        army={armyData.enemy} 
                        bgColor="" 
                        borderColor="border-red-500" 
                        titleColor="" 
                        turn={turn} 
                        onHeroChange={handleHeroChange} 
                        onUnitChange={handleUnitChange} 
                        heroDB={heroDB} 
                        heroPresets={heroPresets}
                        onLoadHeroPreset={handleLoadHeroPreset}
                        onSaveHeroPreset={handleSaveHeroPreset}
                        unitPresets={unitPresets}
                        onLoadUnitPreset={handleLoadUnitPreset}
                        onSaveUnitPreset={handleSaveUnitPreset}
                    />
                </div>
            </div>
        </>
    );
};

const BattleLogs = React.memo(({ logs, theme, logContainerRef }) => {
    return (
        <div ref={logContainerRef} className="theme-log-container rounded-lg flex-1 overflow-y-auto max-h-[450px] lg:max-h-[750px] p-2.5 text-[11px] font-mono leading-relaxed whitespace-pre-wrap shadow-inner">
            {logs.length === 0 && <p className="theme-text-muted text-center mt-4">ボタンを押して開始してください。</p>}
            {logs.map((log, i) => {
                const isHeader = log.includes('====');
                const displayLog = isHeader ? log.replace(/====/g, '').trim() : log;
                
                const isDark = theme === 'dark';
                let className = "mb-1 pl-1 ";
                
                if (isHeader) {
                    className += isDark 
                        ? 'text-cyan-400 mt-4 mb-2 font-bold border-b border-cyan-500/20 bg-cyan-950/15 px-2 py-1 rounded flex items-center'
                        : 'text-sky-700 mt-4 mb-2 font-bold border-b border-sky-200 bg-sky-50/70 px-2 py-1 rounded flex items-center shadow-sm';
                } else if (log.includes('▶ [味方')) {
                    className += isDark 
                        ? 'text-sky-300 font-bold border-l-2 border-sky-500 pl-2 py-0.5 my-1 bg-sky-950/10 rounded-r' 
                        : 'text-sky-700 font-bold border-l-2 border-sky-500 pl-2 py-0.5 my-1 bg-sky-50/50 rounded-r';
                } else if (log.includes('▶ [敵')) {
                    className += isDark 
                        ? 'text-rose-300 font-bold border-l-2 border-rose-500 pl-2 py-0.5 my-1 bg-rose-950/10 rounded-r' 
                        : 'text-rose-700 font-bold border-l-2 border-rose-500 pl-2 py-0.5 my-1 bg-rose-50/50 rounded-r';
                } else if (log.includes('✨') || log.includes('🛡️') || log.includes('🌀') || log.includes('⚡') || log.includes('🎲')) {
                    className += isDark
                        ? 'text-amber-300 font-bold bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/15 my-0.5 ml-2'
                        : 'text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 my-0.5 ml-2';
                } else if (log.includes('💥')) {
                    className += isDark ? 'text-yellow-300 font-bold ml-3' : 'text-yellow-700 font-bold ml-3';
                } else if (log.includes('空振り')) {
                    className += isDark ? 'text-pink-400 font-bold bg-pink-950/10 px-1 rounded ml-2' : 'text-pink-700 font-bold bg-pink-50 px-1 rounded ml-2 border border-pink-100';
                } else if (log.includes('★')) {
                    className += isDark
                        ? 'text-emerald-400 font-bold text-center bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 my-3 text-xs shadow-sm'
                        : 'text-emerald-700 font-bold text-center bg-emerald-50 p-2 rounded-lg border border-emerald-200 my-3 text-xs shadow-sm';
                } else if (log.includes('┣') || log.includes('┃') || log.includes('┗') || log.includes('通常Mod:') || log.includes('追加Mod:') || log.includes('通常:') || log.includes('追加:')) {
                    className += isDark ? 'text-slate-500 text-[10px] ml-4 font-normal' : 'text-slate-400 text-[10px] ml-4 font-normal';
                } else {
                    className += isDark ? 'text-slate-300 ml-2' : 'text-slate-600 ml-2';
                }
                
                return (
                    <div key={i} className={className}>
                        {displayLog}
                    </div>
                );
            })}
        </div>
    );
});

export default App;
