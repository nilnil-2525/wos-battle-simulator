import { useState, useEffect, useRef } from 'react';
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
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
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
            const newPresets = { ...prev, [slot]: JSON.parse(JSON.stringify(heroes)) };
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
            newPresets[type][slot] = {
                tier: unitData.tier,
                initialTroops: unitData.initialTroops,
                buffs: JSON.parse(JSON.stringify(unitData.buffs))
            };
            localStorage.setItem('wos_unit_presets', JSON.stringify(newPresets));
            return newPresets;
        });
    };
    
    const [activeTab, setActiveTab] = useState('single');
    const [simResults, setSimResults] = useState(null);
    const [showDict, setShowDict] = useState(false);
    const [showEditor, setShowEditor] = useState(false); 
    
    const logContainerRef = useRef(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => { 
        if (logContainerRef.current && activeTab === 'single') {
            logContainerRef.current.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' });
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
        setLogs(prev => [...prev, "==== システム通知 ====", "⚙️ エディタから英雄スキルデータを更新・適用しました！"]);
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
            else if (allyTotal === 0) accumulatedLogs.push("★敵軍の勝利！");
            else if (enemyTotal === 0) accumulatedLogs.push("★味方軍の勝利！");
        }

        setArmyData(currentArmyData);
        setLogs(prev => [...prev, ...accumulatedLogs]);
        setTurn(currentTurn);
    };

    const executeMonteCarlo = () => {
        const initialArmyData = JSON.parse(JSON.stringify(armyData));
        const results = [];
        let minTroops = Math.min(getTotalTroops(initialArmyData.ally), getTotalTroops(initialArmyData.enemy));

        for (let i = 0; i < MONTE_CARLO_RUNS; i++) {
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
        setSimResults(results);
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
                    <h1 className="text-2xl font-black tracking-wider flex items-center gap-2 text-sky-400">
                        ⚔️ WOS Battle Sumilator
                    </h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDict(!showDict)} className="text-sm frozen-btn-amber px-4 py-2 rounded-lg font-bold shadow transition flex items-center gap-1">
                            {showDict ? '🔼 辞典を閉じる' : '📚 スキル重複辞典'}
                        </button>
                        <button onClick={() => setShowEditor(true)} className="text-sm frozen-btn-indigo px-4 py-2 rounded-lg font-bold transition shadow">
                            ⚙️ エディタ
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
                        title="味方軍" 
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
                        <div className="flex theme-tab-container p-1 rounded-lg shrink-0">
                            <button onClick={() => setActiveTab('single')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'single' ? 'theme-tab-btn-active' : 'theme-tab-btn-inactive'}`}>📝 1回テスト</button>
                            <button onClick={() => setActiveTab('montecarlo')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'montecarlo' ? 'theme-tab-btn-active' : 'theme-tab-btn-inactive'}`}>📊 1000回テスト</button>
                            <button onClick={handleReset} className="flex-1 py-1.5 text-xs font-bold theme-nested-panel rounded-md transition shadow-sm ml-1">🔄 初期化</button>
                        </div>

                        {activeTab === 'single' && (
                            <>
                                <div className="ice-panel p-3 rounded-xl shadow-md flex flex-col gap-2 shrink-0 border border-slate-700/10">
                                    <button onClick={() => executeBattle(true)} disabled={isGameOver} className="w-full frozen-btn-indigo font-bold py-2 rounded transition active:scale-95 text-sm">1ターン進める</button>
                                    <button onClick={() => executeBattle(false)} disabled={isGameOver} className="w-full frozen-btn-amber font-bold py-2 rounded transition active:scale-95 text-sm">一気に結果を見る</button>
                                </div>

                                <div className="ice-panel p-3 rounded-xl shadow-md shrink-0 border border-slate-700/10">
                                    <h3 className="font-bold text-pink-500 mb-2 text-[11px] border-b border-slate-700/20 pb-1 flex items-center justify-between">
                                        <span>🎲 スキル発動回数 (Turn {turn})</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-[10px] leading-tight">
                                        <div>
                                            <p className="theme-ally-win-text font-bold mb-1 border-b border-slate-700/20 pb-0.5">【味方 兵士】</p>
                                            {armyData.ally.shield.tier === 11 && <div>🛡️ 烈晶盾: <span className="font-bold">{armyData.ally.stats.resshoCount}回</span></div>}
                                            {armyData.ally.spear.tier === 11 && (
                                                <>
                                                    <div>🗡️ 奇襲: <span className="font-bold text-amber-500">{armyData.ally.stats.kisyuCount}回</span></div>
                                                    <div>🗡️ 炎晶戦矛: <span className="font-bold">{armyData.ally.stats.enshoCount}回</span></div>
                                                    <div>🗡️ 熾烈領域: <span className="font-bold">{armyData.ally.stats.shiretsuCount}回</span></div>
                                                </>
                                            )}
                                            {armyData.ally.bow.tier === 11 && (
                                                <>
                                                    <div>🏹 連射: <span className="font-bold">{armyData.ally.stats.renshaCount}回</span></div>
                                                    <div>🏹 燃晶火薬: <span className="font-bold">{armyData.ally.stats.nenshoCount}回</span></div>
                                                </>
                                            )}
                                            
                                            {Object.keys(armyData.ally.stats.heroSkillCounts).length > 0 && (
                                                <div className="mt-2">
                                                    <p className="theme-ally-win-text font-bold mb-1 border-b border-slate-700/20 pb-0.5">【味方 英雄】</p>
                                                    {Object.values(armyData.ally.stats.heroSkillCounts).map((s, idx) => (
                                                        <div key={idx} className="theme-text-muted whitespace-nowrap overflow-hidden text-ellipsis">✨ {s.name}: <span className="font-bold text-teal-600">{s.count}回</span></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="theme-enemy-win-text font-bold mb-1 border-b border-slate-700/20 pb-0.5">【敵 兵士】</p>
                                            {armyData.enemy.shield.tier === 11 && <div>🛡️ 烈晶盾: <span className="font-bold">{armyData.enemy.stats.resshoCount}回</span></div>}
                                            {armyData.enemy.spear.tier === 11 && (
                                                <>
                                                    <div>🗡️ 奇襲: <span className="font-bold text-amber-500">{armyData.enemy.stats.kisyuCount}回</span></div>
                                                    <div>🗡️ 炎晶戦矛: <span className="font-bold">{armyData.enemy.stats.enshoCount}回</span></div>
                                                    <div>🗡️ 熾烈領域: <span className="font-bold">{armyData.enemy.stats.shiretsuCount}回</span></div>
                                                </>
                                            )}
                                            {armyData.enemy.bow.tier === 11 && (
                                                <>
                                                    <div>🏹 連射: <span className="font-bold">{armyData.enemy.stats.renshaCount}回</span></div>
                                                    <div>🏹 燃晶火薬: <span className="font-bold">{armyData.enemy.stats.nenshoCount}回</span></div>
                                                </>
                                            )}

                                            {Object.keys(armyData.enemy.stats.heroSkillCounts).length > 0 && (
                                                <div className="mt-2">
                                                    <p className="theme-enemy-win-text font-bold mb-1 border-b border-slate-700/20 pb-0.5">【敵 英雄】</p>
                                                    {Object.values(armyData.enemy.stats.heroSkillCounts).map((s, idx) => (
                                                        <div key={idx} className="theme-text-muted whitespace-nowrap overflow-hidden text-ellipsis">✨ {s.name}: <span className="font-bold text-teal-600">{s.count}回</span></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="ice-panel p-3 rounded-xl shadow-md flex flex-col min-h-[400px] lg:flex-1 lg:min-h-0 border border-slate-700/10">
                                    <h3 className="font-bold mb-1 text-xs border-b border-slate-700/20 pb-1 shrink-0">詳細戦闘ログ</h3>
                                    <div ref={logContainerRef} className="theme-log-container rounded flex-1 overflow-y-auto p-2 text-[10px] font-mono leading-relaxed whitespace-pre-wrap">
                                        {logs.length === 0 && <p className="theme-text-muted text-center mt-4">ボタンを押して開始してください。</p>}
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
                                                'theme-text-muted'}`}>{log}</div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'montecarlo' && (
                            <div className="ice-panel p-3 rounded-xl shadow-md flex flex-col gap-4 min-h-[400px] lg:flex-1 lg:min-h-0 overflow-y-auto border border-slate-700/10">
                                <button onClick={executeMonteCarlo} disabled={turn > 0} className="w-full frozen-btn-indigo font-bold py-3 rounded-lg transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                                    🚀 1000回シミュレーション実行
                                </button>
                                {turn > 0 && <p className="text-[10px] text-red-500 text-center font-bold">※テストを行うには、初期化ボタンでTurn0に戻してください。</p>}

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
                                                    <div className="flex flex-col gap-1 text-[11px] mb-2 px-2 theme-ally-win-text theme-log-container rounded py-1.5 font-bold shadow-inner">
                                                        <div className="flex justify-between border-b border-slate-700/10 pb-1">
                                                            <span>🎯 期待値(平均): <span className="theme-ally-win-text text-sm">{allyStats.mean.toLocaleString()}人</span></span>
                                                            <span>安定度(中央): <span className="theme-ally-win-text-sub">{allyStats.median.toLocaleString()}人</span></span>
                                                        </div>
                                                        <div className="text-right text-[9px] theme-ally-win-text-sub">
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
                                                    <div className="flex flex-col gap-1 text-[11px] mb-2 px-2 theme-enemy-win-text theme-log-container rounded py-1.5 font-bold shadow-inner">
                                                        <div className="flex justify-between border-b border-slate-700/10 pb-1">
                                                            <span>🎯 期待値(平均): <span className="theme-enemy-win-text text-sm">{enemyStats.mean.toLocaleString()}人</span></span>
                                                            <span>安定度(中央): <span className="theme-enemy-win-text-sub">{enemyStats.median.toLocaleString()}人</span></span>
                                                        </div>
                                                        <div className="text-right text-[9px] theme-enemy-win-text-sub">
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
                        title="敵軍" 
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

export default App;
