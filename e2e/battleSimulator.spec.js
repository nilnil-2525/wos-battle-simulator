import { test, expect } from '@playwright/test';

test.describe('WOS Battle Simulator E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // ページで発生した未キャッチのエラーを検知してテストを失敗させる
    page.on('pageerror', (exception) => {
      throw new Error(`ブラウザ側で未キャッチの例外が発生しました: ${exception.message}`);
    });

    // アプリページを開く
    await page.goto('/');
  });

  test('初期状態で「1回テスト」タブが選択されており、部隊情報が表示されていること', async ({ page }) => {
    // 📝 1回テスト タブが表示されているか確認
    const singleTab = page.locator('button:has-text("📝 1回テスト")');
    await expect(singleTab).toBeVisible();
    await expect(singleTab).toHaveClass(/theme-tab-btn-active/);

    // 部隊パネルが表示されているか確認
    await expect(page.locator('h2:has-text("味方")')).toBeVisible();
    await expect(page.locator('h2:has-text("敵")')).toBeVisible();
  });

  test('1回テスト：1ターン進行と一気に結果を見る機能が正常に動作すること', async ({ page }) => {
    // 1. 「1ターン進める」ボタンをクリック
    const oneTurnBtn = page.locator('button:has-text("1ターン進める")');
    await expect(oneTurnBtn).toBeEnabled();
    await oneTurnBtn.click();

    // 2. ログコンテナにターン1のログが出力されていること
    const logContainer = page.locator('.log-container, pre'); // ログ表示エリアのセレクタ
    // ログエリアを特定するためのテキストチェック
    await expect(page.locator('text===== ターン 1 ====')).toBeVisible();

    // 3. 「一気に結果を見る」ボタンをクリック
    const quickResultBtn = page.locator('button:has-text("一気に結果を見る")');
    await expect(quickResultBtn).toBeEnabled();
    await quickResultBtn.click();

    // 4. 勝敗結果のテキスト（味方の勝利！、敵の勝利！、引き分け！のいずれか）が表示されていること
    const logText = await page.locator('body').innerText();
    const hasGameEnded = logText.includes('★味方の勝利！') || 
                         logText.includes('★敵の勝利！') || 
                         logText.includes('★引き分け！');
    expect(hasGameEnded).toBe(true);
  });

  test('1000回テスト：モンテカルロシミュレーションが正常に実行されること', async ({ page }) => {
    // 1. 「📊 1000回テスト」タブをクリック
    const monteCarloTab = page.locator('button:has-text("📊 1000回テスト")');
    await monteCarloTab.click();
    await expect(monteCarloTab).toHaveClass(/theme-tab-btn-active/);

    // 2. 「1000回シミュレーション実行」ボタンをクリック
    const runBtn = page.locator('button:has-text("1000回シミュレーション実行")');
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // 3. 勝率や残兵数の統計結果コンテナ（円グラフやヒストグラム）が描画されていること
    await expect(page.locator('text=🏆 勝率データ (1,000戦中)')).toBeVisible();
    await expect(page.locator('text=期待値(平均):').first()).toBeVisible();
  });

});
