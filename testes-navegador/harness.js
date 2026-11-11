/* Harness: serve o app por http, troca o core por uma cópia que usa o Firebase falso, compartilha o "servidor" entre aparelhos. */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
function servidor(htmlPath) {
  const html = fs.readFileSync(htmlPath);
  return new Promise(res => { const s = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(html); }); s.listen(0, '127.0.0.1', () => res({ s, url: 'http://127.0.0.1:' + s.address().port + '/app.html' })); });
}
function coreFalso() {
  let t = fs.readFileSync(path.join(ROOT, 'vendor/fenix-core-ref.js'), 'utf8');
  t = t.replace(/https:\/\/www\.gstatic\.com\/firebasejs\/10\.12\.2\/[a-z-]+\.js/g, 'https://fake.local/fake-firebase.js');
  return t;
}
function novoServidorFake() {
  const store = {}, contas = {}, paginas = new Set();
  const api = { store, contas, paginas,
    async avisar() { for (const p of paginas) { try { await p.evaluate(() => window.__fbNotify && window.__fbNotify()); } catch (e) { } } } };
  return api;
}
async function aparelho(browser, srv, url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, acceptDownloads: true, ...(opts.ctx || {}) });
  const p = await ctx.newPage(); const erros = [];
  await preparar(p, srv, erros);
  await p.goto(url);
  return { ctx, p, erros };
}
async function preparar(p, srv, erros) {
  p.on('pageerror', e => erros.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FAILED|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/javascript' };
  await p.route('https://fake.local/fenix-core.js', r => r.fulfill({ status: 200, headers: cors, body: coreFalso() }));
  await p.route('https://fake.local/fake-firebase.js', r => r.fulfill({ status: 200, headers: cors, body: fs.readFileSync(path.join(__dirname, 'fake-firebase.js'), 'utf8') }));
  await p.route(/^https:\/\/(fenicris-dev\.github\.io|brasilapi|viacep)/, r => r.abort());
  await p.addInitScript(() => { window.FENIX_CORE_URL = 'https://fake.local/fenix-core.js'; });
  srv.paginas.add(p);
  await p.exposeFunction('__fbSet', async (pth, json) => { srv.store[pth] = JSON.parse(json); setTimeout(() => srv.avisar(), 5); });
  await p.exposeFunction('__fbDel', async pth => { delete srv.store[pth]; setTimeout(() => srv.avisar(), 5); });
  await p.exposeFunction('__fbGet', async pth => JSON.stringify(srv.store[pth] || null));
  await p.exposeFunction('__fbList', async coll => JSON.stringify(Object.keys(srv.store).filter(k => k.startsWith(coll + '/') && k.slice(coll.length + 1).indexOf('/') < 0).map(k => ({ id: k.slice(coll.length + 1), data: srv.store[k] }))));
  await p.exposeFunction('__fbAuth', async (op, email, senha) => {
    email = (email || '').toLowerCase();
    if (op === 'criar') { if (srv.contas[email]) return JSON.stringify({ erro: 'auth/email-already-in-use' }); srv.contas[email] = { senha, uid: 'u' + Object.keys(srv.contas).length + 1 }; return JSON.stringify({ user: { uid: srv.contas[email].uid, email } }); }
    if (op === 'entrar') { const c = srv.contas[email]; if (!c || c.senha !== senha) return JSON.stringify({ erro: 'auth/invalid-credential' }); return JSON.stringify({ user: { uid: c.uid, email } }); }
    if (op === 'google') { if (!srv.contas[email]) srv.contas[email] = { senha: '', uid: 'g1' }; return JSON.stringify({ user: { uid: srv.contas[email].uid, email, displayName: 'Mãe Teste' } }); }
    if (op === 'redefinir') return JSON.stringify(srv.contas[email] ? {} : { erro: 'auth/user-not-found' });
    return JSON.stringify({ erro: 'auth/internal-error' });
  });
}
/* cria conta, passa pelo primeiro acesso e espera o app aparecer */
async function logar(p, email = 'teste@fenix.com') {
  await p.waitForSelector('iframe#fx-login', { timeout: 20000 });
  const L = p.frameLocator('#fx-login');
  await L.locator('#tab-register').click(); await L.locator('#reg-email').fill(email); await L.locator('#reg-password').fill('Senha1234!'); await L.locator('#reg-confirm').fill('Senha1234!'); await L.locator('#reg-terms').check(); await L.locator('#register-btn').click();
  await p.waitForSelector('iframe#fx-onb', { timeout: 20000 });
  const O = p.frameLocator('#fx-onb'); await O.locator('#ob-nome').fill('Ana'); await O.locator('#ob-btn').click(); await O.locator('#ob-pronto.visible').waitFor(); await O.locator('#ob-entrar').click();
  await p.waitForSelector('header.top', { state: 'visible', timeout: 20000 }); await p.waitForTimeout(300);
}
module.exports = { servidor, novoServidorFake, aparelho, preparar, logar, ROOT };
