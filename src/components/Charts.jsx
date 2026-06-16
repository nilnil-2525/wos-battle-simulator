import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export const WinRateChart = ({ results }) => {
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
    return <div style={{ height: '10rem', position: 'relative' }}><canvas ref={canvasRef}></canvas></div>;
};

export const HistogramChart = ({ data, color, label }) => {
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
    }, [data, color, label]);
    return <div style={{ height: '10rem', position: 'relative' }}><canvas ref={canvasRef}></canvas></div>;
};
