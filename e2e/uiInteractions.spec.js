import { test, expect } from '@playwright/test';

test.describe('WOS Battle Simulator Detailed UI Interaction Tests', () => {

  test.beforeEach(async ({ page }) => {
    // ブラウザ例外を監視
    page.on('pageerror', (exception) => {
      throw new Error(`ブラウザ側で未キャッチの例外が発生しました: ${exception.message}`);
    });
    await page.goto('/');
    // localStorage を初期化してクリーンな状態でテストする
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('バフ入力欄の変更によって、リアルタイム計算された実ステータスが更新されること', async ({ page }) => {
    // 1. 味方・槍兵パネル内の攻撃バフ入力欄と、実ステータス表示（攻: XXX）を取得
    const spearPanel = page.locator('.theme-unit-panel-ally').filter({ hasText: '槍兵' });
    const attackBuffInput = spearPanel.locator('div').filter({ hasText: '攻撃' }).locator('input[type="number"]').first();
    const statsLog = spearPanel.locator('.theme-log-container');

    // 2. 初期表示の攻撃力値を取得
    const initialText = await statsLog.innerText();
    const initialAtkMatch = initialText.match(/攻:\s*(\d+)/);
    expect(initialAtkMatch).not.toBeNull();
    const initialAtkValue = parseInt(initialAtkMatch[1]);

    // 3. 攻撃バフを 100% に変更する
    await attackBuffInput.fill('100');

    // 4. 実ステータスの攻撃力値が増加していることを検証
    await expect(async () => {
      const updatedText = await statsLog.innerText();
      const updatedAtkMatch = updatedText.match(/攻:\s*(\d+)/);
      expect(updatedAtkMatch).not.toBeNull();
      const updatedAtkValue = parseInt(updatedAtkMatch[1]);
      expect(updatedAtkValue).toBeGreaterThan(initialAtkValue);
    }).toPass();
  });

  test('英雄の選択変更がシミュレーション結果（ログ出力）に反映されること', async ({ page }) => {
    // 1. 味方の「槍リーダー」を「ミア」に変更する
    // 味方パネル（タイトル「味方」）の中の槍リーダーセレクトボックスを特定
    const allyPanel = page.locator('.ice-panel-ally');
    const spearLeaderSelect = allyPanel.locator('.theme-hero-selector').filter({ hasText: '槍リーダー' }).locator('select');
    await spearLeaderSelect.selectOption({ label: 'ミア' });

    // 2. 「1ターン進める」ボタンをクリックしてシミュレーションを実行
    const oneTurnBtn = page.locator('button:has-text("1ターン進める")');
    await oneTurnBtn.click();

    // 3. ログエリアにミアのスキル発動に関わるログ（例: "ミア" というキーワード）が出力されていることを確認
    const logContainer = page.locator('h3:has-text("詳細戦闘ログ") + div');
    await expect(logContainer).toContainText('ミア');
  });

  test('兵士数を0に変更した際、戦闘からその兵種が除外されること', async ({ page }) => {
    // 1. 敵の「弓兵」の兵士数入力欄を特定し、0に変更する
    const enemyPanel = page.locator('div.ice-panel-enemy');
    const enemyBowPanel = enemyPanel.locator('div:has-text("弓兵")').first();
    const troopsInput = enemyBowPanel.locator('input[type="number"]').first();
    
    await troopsInput.fill('0');

    // 2. 「一気に結果を見る」をクリックしてシミュレーションを実行
    const quickResultBtn = page.locator('button:has-text("一気に結果を見る")');
    await quickResultBtn.click();

    // 3. ログの中に「敵 bow ➔」や「敵 bow の攻撃」といったアクティビティが一切含まれていないことを確認
    // (兵数が0になった兵種は優先度フェーズでスキップされるため)
    const logContainer = page.locator('h3:has-text("詳細戦闘ログ") + div');
    const logContent = await logContainer.innerText();
    expect(logContent.includes('▶ [敵 bow] ➔')).toBe(false);
  });

  test('英雄プリセットの保存と読み込みが正常に動作すること', async ({ page }) => {
    const allyPanel = page.locator('.ice-panel-ally');
    const spearLeaderSelect = allyPanel.locator('.theme-hero-selector').filter({ hasText: '槍リーダー' }).locator('select');
    const presetBtn = allyPanel.locator('.theme-hero-section .preset-btn-register');
    const slot1Btn = allyPanel.locator('.theme-hero-section .preset-slots-container button').first();

    // 1. 槍リーダーをミアに変更
    await spearLeaderSelect.selectOption({ label: 'ミア' });

    // 2. Preset ボタンをクリックして登録モードにする
    await presetBtn.click();
    await expect(presetBtn).toHaveClass(/active/);

    // 3. スロット1をクリックして保存 (登録モードが解除される)
    await slot1Btn.click();
    await expect(presetBtn).not.toHaveClass(/active/);

    // 4. 槍リーダーを一時的に none に変更
    await spearLeaderSelect.selectOption('none');
    await expect(spearLeaderSelect).toHaveValue('none');

    // 5. スロット1をクリックしてロード
    await slot1Btn.click();

    // 6. 槍リーダーがミアに戻っていることを確認
    await expect(spearLeaderSelect).toHaveValue('mia');
  });

  test('兵士プリセットの保存と読み込みが正常に動作すること', async ({ page }) => {
    const shieldPanel = page.locator('.theme-unit-panel-ally').filter({ has: page.locator('h4:has-text("盾兵")') });
    const troopsInput = shieldPanel.locator('input[type="number"]').first();
    const presetBtn = shieldPanel.locator('.preset-btn-register');
    const slot1Btn = shieldPanel.locator('.preset-slots-container button').first();

    // 1. 兵士数を 9999 に変更
    await troopsInput.fill('9999');

    // 2. Preset ボタンをクリックして登録モードにする
    await presetBtn.click();
    await expect(presetBtn).toHaveClass(/active/);

    // 3. スロット1をクリックして保存
    await slot1Btn.click();
    await expect(presetBtn).not.toHaveClass(/active/);

    // 4. 兵士数を 100 に変更
    await troopsInput.fill('100');
    await expect(troopsInput).toHaveValue('100');

    // 5. スロット1をクリックしてロード
    await slot1Btn.click();

    // 6. 兵士数が 9999 に戻っていることを確認
    await expect(troopsInput).toHaveValue('9999');
  });

});
