import { useState, useEffect, useRef } from 'react';
import { WinRateChart, HistogramChart } from './components/Charts.jsx';
import { ArmyPanel } from './components/ArmyPanel.jsx';
import { InlineSkillDictionary } from './components/InlineSkillDictionary.jsx';
import { SkillTestEditorModal } from './components/SkillTestEditorModal.jsx';
import styles from './App.module.css';
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

    const getLogClass = (log) => {
        let cls = styles.logLine;
        if (log.includes('✨')) return `${cls} ${styles.logLineHero}`;
        if (log.includes('🛡️')) return `${cls} ${styles.logLineTroop}`;
        if (log.includes('🌀')) return `${cls} ${styles.logLineStun}`;
        if (log.includes('⚡')) return `${cls} ${styles.logLineCrit}`;
        if (log.includes('🎲')) return `${cls} ${styles.logLineDice}`;
        if (log.includes('空振り')) return `${cls} ${styles.logLineMiss}`;
        if (log.includes('▶ [味方')) return `${cls} ${styles.logLineAlly}`;
        if (log.includes('▶ [敵')) return `${cls} ${styles.logLineEnemy}`;
        if (log.includes('💥')) return `${cls} ${styles.logLineDmg}`;
        if (log.includes('====')) return `${cls} ${styles.logLineHeader}`;
        if (log.includes('┣') || log.includes('┃') || log.includes('┗') || log.includes('通常Mod:') || log.includes('追加Mod:') || log.includes('通常:') || log.includes('追加:')) return `${cls} ${styles.logLineSubDetail}`;
        return `${cls} ${styles.logLineDefault}`;
    };

    return (
        <div className={styles.container}>
            {showEditor && (
                <SkillTestEditorModal 
                    currentDB={heroDB} 
                    initialHeroDB={INITIAL_HERO_DB} 
                    onSave={handleSaveHeroDB} 
                    onClose={() => setShowEditor(false)} 
                />
            )}

            <header className={styles.header}>
                <h1 className={styles.headerTitle}>WOS戦闘シミュレーター</h1>
                <div className={styles.headerButtonContainer}>
                    <p className={styles.versionBadge}>
                        ⚔️ UI・ログ最適化 V39 ⚔️
                    </p>
                    <button onClick={() => setShowDict(!showDict)} className={styles.btnDict}>
                        {showDict ? '🔼 辞典を閉じる' : '📚 スキル重複辞典を開く'}
                    </button>
                    <button onClick={() => setShowEditor(true)} className={styles.btnEditor}>
                        ⚙️ エディタ
                    </button>
                </div>
            </header>

            {showDict && <InlineSkillDictionary heroDB={heroDB} />}

            <div className={styles.mainLayout}>
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
                
                <div className={styles.sidebar}>
                    <div className={styles.tabContainer}>
                        <button onClick={() => setActiveTab('single')} className={`${styles.tabBtn} ${activeTab === 'single' ? styles.tabBtnActiveSingle : ''}`}>📝 1回テスト (詳細ログ)</button>
                        <button onClick={() => setActiveTab('montecarlo')} className={`${styles.tabBtn} ${activeTab === 'montecarlo' ? styles.tabBtnActiveMonte : ''}`}>📊 1000回テスト (最強分析)</button>
                        <button onClick={handleReset} className={styles.btnReset}>🔄 初期化</button>
                    </div>

                    {activeTab === 'single' && (
                        <>
                            <div className={styles.singleTestControls}>
                                <button onClick={() => executeBattle(true)} disabled={isGameOver} className={`${styles.btnAction} ${styles.btnNextTurn}`}>1ターン進める</button>
                                <button onClick={() => executeBattle(false)} disabled={isGameOver} className={`${styles.btnAction} ${styles.btnShowResult}`}>一気に結果を見る</button>
                            </div>

                            <div className={styles.skillCountWidget}>
                                <h3 className={styles.widgetHeader}>
                                    <span>🎲 スキル発動回数 (Turn {turn})</span>
                                </h3>
                                <div className={styles.widgetGrid}>
                                    <div>
                                        <p className={styles.widgetSubTitleAlly}>【味方 兵士】</p>
                                        {armyData.ally.shield.tier === 11 && <div className={styles.widgetItemText}>🛡️ 烈晶盾: <span className={styles.widgetItemCount}>{armyData.ally.stats.resshoCount}回</span></div>}
                                        {armyData.ally.spear.tier === 11 && (
                                            <>
                                                <div className={styles.widgetItemText}>🗡️ 奇襲: <span className={styles.widgetItemCountKisyu}>{armyData.ally.stats.kisyuCount}回</span></div>
                                                <div className={styles.widgetItemText}>🗡️ 炎晶戦矛: <span className={styles.widgetItemCount}>{armyData.ally.stats.enshoCount}回</span></div>
                                                <div className={styles.widgetItemText}>🗡️ 熾烈領域: <span className={styles.widgetItemCount}>{armyData.ally.stats.shiretsuCount}回</span></div>
                                            </>
                                        )}
                                        {armyData.ally.bow.tier === 11 && (
                                            <>
                                                <div className={styles.widgetItemText}>🏹 連射: <span className={styles.widgetItemCount}>{armyData.ally.stats.renshaCount}回</span></div>
                                                <div className={styles.widgetItemText}>🏹 燃晶火薬: <span className={styles.widgetItemCount}>{armyData.ally.stats.nenshoCount}回</span></div>
                                            </>
                                        )}
                                        
                                        {Object.keys(armyData.ally.stats.heroSkillCounts).length > 0 && (
                                            <div className="mt-2">
                                                <p className={styles.widgetSubTitleAlly}>【味方 英雄】</p>
                                                {Object.values(armyData.ally.stats.heroSkillCounts).map((s, idx) => (
                                                    <div key={idx} className={styles.widgetItemHeroText}>✨ {s.name}: <span className={styles.widgetItemCountHero}>{s.count}回</span></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className={styles.widgetSubTitleEnemy}>【敵 兵士】</p>
                                        {armyData.enemy.shield.tier === 11 && <div className={styles.widgetItemText}>🛡️ 烈晶盾: <span className={styles.widgetItemCount}>{armyData.enemy.stats.resshoCount}回</span></div>}
                                        {armyData.enemy.spear.tier === 11 && (
                                            <>
                                                <div className={styles.widgetItemText}>🗡️ 奇襲: <span className={styles.widgetItemCountKisyu}>{armyData.enemy.stats.kisyuCount}回</span></div>
                                                <div className={styles.widgetItemText}>🗡️ 炎晶戦矛: <span className={styles.widgetItemCount}>{armyData.enemy.stats.enshoCount}回</span></div>
                                                <div className={styles.widgetItemText}>🗡️ 熾烈領域: <span className={styles.widgetItemCount}>{armyData.enemy.stats.shiretsuCount}回</span></div>
                                            </>
                                        )}
                                        {armyData.enemy.bow.tier === 11 && (
                                            <>
                                                <div className={styles.widgetItemText}>🏹 連射: <span className={styles.widgetItemCount}>{armyData.enemy.stats.renshaCount}回</span></div>
                                                <div className={styles.widgetItemText}>🏹 燃晶火薬: <span className={styles.widgetItemCount}>{armyData.enemy.stats.nenshoCount}回</span></div>
                                            </>
                                        )}

                                        {Object.keys(armyData.enemy.stats.heroSkillCounts).length > 0 && (
                                            <div className="mt-2">
                                                <p className={styles.widgetSubTitleEnemy}>【敵 英雄】</p>
                                                {Object.values(armyData.enemy.stats.heroSkillCounts).map((s, idx) => (
                                                    <div key={idx} className={styles.widgetItemHeroText}>✨ {s.name}: <span className={styles.widgetItemCountHero}>{s.count}回</span></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.logWidget}>
                                <h3 className={styles.logHeader}>詳細戦闘ログ</h3>
                                <div ref={logContainerRef} className={styles.logConsole}>
                                    {logs.length === 0 && <p className={styles.logConsoleEmpty}>ボタンを押して開始してください。</p>}
                                    {logs.map((log, i) => (
                                        <div key={i} className={getLogClass(log)}>{log}</div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'montecarlo' && (
                        <div className={styles.monteContainer}>
                            <button onClick={executeMonteCarlo} disabled={turn > 0} className={styles.btnMonteRun}>
                                🚀 1000回シミュレーション実行
                            </button>
                            {turn > 0 && <p className={styles.monteWarning}>※テストを行うには、初期化ボタンでTurn0に戻してください。</p>}

                            {simResults && (
                                <div className={styles.monteResultsArea}>
                                    <div className={styles.monteCard}>
                                        <h3 className={styles.monteCardTitle}>🏆 勝率データ (1,000戦中)</h3>
                                        <WinRateChart results={simResults} />
                                        <div className={styles.winRateFlex}>
                                            <span className={styles.winRateAllyText}>味方: {simResults.filter(r=>r.winner==='ally').length}勝</span>
                                            <span className={styles.winRateEnemyText}>敵: {simResults.filter(r=>r.winner==='enemy').length}勝</span>
                                        </div>
                                    </div>

                                    <div className={styles.survivingAnalysisCardAlly}>
                                        <h3 className={styles.survivingTitleAlly}>🟦 味方勝利時の「残り兵力」分析</h3>
                                        {allyWinResults.length > 0 ? (
                                            <>
                                                <div className={styles.survivingStatsAlly}>
                                                    <div className={styles.survivingStatsRow}>
                                                        <span>🎯 期待値(平均): <span className={styles.survivingStatsAvgAlly}>{allyStats.mean.toLocaleString()}人</span></span>
                                                        <span>安定度(中央): <span className={styles.survivingStatsMedianAlly}>{allyStats.median.toLocaleString()}人</span></span>
                                                    </div>
                                                    <div className={styles.survivingStatsStdAlly}>
                                                        ブレ幅(σ): ±{allyStats.stdDev.toLocaleString()}
                                                    </div>
                                                </div>
                                                <HistogramChart data={allyWinResults} color="#3b82f6" label="味方生存数" />
                                            </>
                                        ) : <p className={styles.monteEmptyText}>味方の勝利データなし</p>}
                                    </div>

                                    <div className={styles.survivingAnalysisCardEnemy}>
                                        <h3 className={styles.survivingTitleEnemy}>🟥 敵勝利時の「残り兵力」分析</h3>
                                        {enemyWinResults.length > 0 ? (
                                            <>
                                                <div className={styles.survivingStatsEnemy}>
                                                    <div className={styles.survivingStatsRowEnemy}>
                                                        <span>🎯 期待値(平均): <span className={styles.survivingStatsAvgEnemy}>{enemyStats.mean.toLocaleString()}人</span></span>
                                                        <span>安定度(中央): <span className={styles.survivingStatsMedianEnemy}>{enemyStats.median.toLocaleString()}人</span></span>
                                                    </div>
                                                    <div className={styles.survivingStatsStdEnemy}>
                                                        ブレ幅(σ): ±{enemyStats.stdDev.toLocaleString()}
                                                    </div>
                                                </div>
                                                <HistogramChart data={enemyWinResults} color="#ef4444" label="敵生存数" />
                                            </>
                                        ) : <p className={styles.monteEmptyText}>敵の勝利データなし</p>}
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
