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
    const [heroDB, setHeroDB] = useState(JSON.parse(JSON.stringify(INITIAL_HERO_DB)));
    const [armyData, setArmyData] = useState({ 
        ally: JSON.parse(JSON.stringify(initialArmyState)), 
        enemy: JSON.parse(JSON.stringify(initialArmyState)) 
    });
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
        <div className="max-w-7xl mx-auto p-4 min-h-screen animate-fade-in relative">
            {showEditor && (
                <SkillTestEditorModal 
                    currentDB={heroDB} 
                    initialHeroDB={INITIAL_HERO_DB} 
                    onSave={handleSaveHeroDB} 
                    onClose={() => setShowEditor(false)} 
                />
            )}

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
                <ArmyPanel 
                    side="ally" 
                    title="味方軍" 
                    army={armyData.ally} 
                    bgColor="bg-blue-50/50" 
                    borderColor="border-blue-500" 
                    titleColor="text-blue-700" 
                    turn={turn} 
                    onHeroChange={handleHeroChange} 
                    onUnitChange={handleUnitChange} 
                    heroDB={heroDB} 
                />
                
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
                
                <ArmyPanel 
                    side="enemy" 
                    title="敵軍" 
                    army={armyData.enemy} 
                    bgColor="bg-red-50/50" 
                    borderColor="border-red-500" 
                    titleColor="text-red-700" 
                    turn={turn} 
                    onHeroChange={handleHeroChange} 
                    onUnitChange={handleUnitChange} 
                    heroDB={heroDB} 
                />
            </div>
        </div>
    );
};

export default App;
