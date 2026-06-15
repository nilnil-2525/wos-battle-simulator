import yaml from 'js-yaml';

export const loadGameData = async () => {
    const response = await fetch('/game-data.yaml', { cache: 'no-store' });
    if (!response.ok) throw new Error('game-data.yaml を読み込めませんでした: HTTP ' + response.status);
    return yaml.load(await response.text());
};
