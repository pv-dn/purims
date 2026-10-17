import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'images');
const url = process.env.PURIMS_URL || 'https://pv-dn.github.io/purims/';
const password = process.env.PURIMS_PASS || 'admin1234';

async function shot(page, name) {
  await page.evaluate(() => {
    const t = document.getElementById('toast');
    if (t) t.classList.remove('show');
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
  console.log('saved', name);
}

async function login(page) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  await shot(page, '01-login');
  await page.locator('#login-pass').fill(password);
  await page.locator('.login-btn').click();
  await page.waitForTimeout(2800);
}

async function pickFirstClient(page, selectId) {
  const value = await page.evaluate((id) => {
    const sel = document.getElementById(id);
    if (!sel) return '';
    const opt = [...sel.options].find((o) => o.value);
    if (!opt) return '';
    sel.value = opt.value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return opt.value;
  }, selectId);
  await page.waitForTimeout(700);
  return value;
}

async function fillSomeQty(page) {
  await page.evaluate(() => {
    const inputs = [...document.querySelectorAll('#iarea-body input.qty, #iarea input.qty')];
    inputs.slice(0, 3).forEach((el, i) => {
      el.value = String((i + 1) * 2);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.className = 'qty f';
    });
  });
  await page.waitForTimeout(300);
}

async function openMaster(page) {
  await page.locator('#tab-master').click();
  await page.waitForTimeout(500);
  const auth = page.locator('#master-auth-modal');
  if (await auth.isVisible().catch(() => false)) {
    await shot(page, '04-master-auth');
    await page.locator('#master-auth-input').fill(password);
    await page.locator('#master-auth-modal button', { hasText: '認証' }).click();
    await page.waitForTimeout(900);
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PURIMS_CHANNEL || 'chrome',
  });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 860 },
    deviceScaleFactor: 1,
  });

  await login(page);

  // 伝票発行（客先未選択の全体）
  await page.locator('#tab-slip').click();
  await page.waitForTimeout(400);
  await shot(page, '02-slip');

  // 伝票入力（客先選択＋数量）
  const client = await pickFirstClient(page, 'csel');
  console.log('client', client || '(none)');
  if (client) {
    await fillSomeQty(page);
    await shot(page, '02b-slip-input');
  }

  // 発行履歴
  await page.locator('#tab-history').click();
  await page.waitForTimeout(800);
  await shot(page, '03-history');
  // 月フォルダがあれば開く
  const folder = page.locator('#hist-list .folder, #hist-list [onclick*="toggle"], #hist-list div').filter({ hasText: '202' }).first();
  if (await folder.count()) {
    try {
      await folder.click({ timeout: 1500 });
      await page.waitForTimeout(500);
      await shot(page, '03b-history-open');
    } catch (_) {}
  }

  // マスタ
  await openMaster(page);
  await shot(page, '05-master');

  // 既存客先の編集（選択後）
  const mClient = await pickFirstClient(page, 'msel');
  console.log('master client', mClient || '(none)');
  if (mClient) {
    await page.waitForTimeout(500);
    await shot(page, '05b-master-edit');
    // 品目エリアが見えるよう少しスクロール
    await page.evaluate(() => {
      const p = document.getElementById('panel-master');
      if (p) p.scrollTop = 280;
    });
    await page.waitForTimeout(300);
    await shot(page, '05c-master-items');
  }

  // 新規客先
  await page.locator('#ctab-new').click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const p = document.getElementById('panel-master');
    if (p) p.scrollTop = 0;
  });
  await shot(page, '05d-master-new');

  // 商品コード一覧
  await page.locator('button.m-tab', { hasText: '商品コード一覧' }).click();
  await page.waitForTimeout(500);
  await shot(page, '05e-master-products');

  // データ（請求系トグル〜伝票フッターが写る高さで撮影）
  await page.setViewportSize({ width: 1365, height: 980 });
  await page.locator('#tab-data').click();
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const p = document.getElementById('panel-data');
    if (!p) return;
    // クラウド同期の下＝表示設定（請求系＋フッター）が上に来る程度
    p.scrollTop = 120;
  });
  await page.waitForTimeout(300);
  await shot(page, '06-data');
  await page.setViewportSize({ width: 1365, height: 860 });

  // 使い方（アコーディオンは閉じた初期状態のまま）
  await page.locator('#tab-help').click();
  await page.waitForTimeout(700);
  await shot(page, '07-help');

  await browser.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
