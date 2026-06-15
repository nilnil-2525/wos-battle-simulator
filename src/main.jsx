import React from 'react';
import { createRoot } from 'react-dom/client';
import App, { applyGameData } from './App.jsx';
import { loadGameData } from './config/loadGameData.js';
import './styles.css';

const ConfigLoadError = ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 text-slate-800">
        <div className="bg-white border border-red-200 rounded-lg shadow-md p-5 max-w-xl">
            <h1 className="text-lg font-bold text-red-700 mb-2">ゲームデータを読み込めませんでした</h1>
            <p className="text-sm text-slate-700 mb-3">game-data.yaml の内容、またはHTTPサーバー経由で開いているかを確認してください。</p>
            <pre className="text-xs bg-slate-950 text-red-200 p-3 rounded overflow-auto">{String(error.message || error)}</pre>
        </div>
    </div>
);

const root = createRoot(document.getElementById('root'));

loadGameData()
    .then(data => {
        applyGameData(data);
        root.render(<App />);
    })
    .catch(error => root.render(<ConfigLoadError error={error} />));
