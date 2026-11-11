/* node -r tests/legacy-login.js testes-antigos.js app.html : faz os testes antigos (que abrem o arquivo direto) passarem pelo login Fênix falso */
const pw = require('playwright'); const { novoServidorFake, preparar, logar } = require('./harness');
let n = 0; const srv = novoServidorFake(); const orig = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (...a) => { const b = await orig(...a); const nc = b.newContext.bind(b);
  b.newContext = async (...x) => { const c = await nc(...x); const np = c.newPage.bind(c);
    c.newPage = async (...y) => { const p = await np(...y); const g = p.goto.bind(p); let feito = false;
      p.goto = async (u, o) => { if (feito || !/^file:/.test(u)) return g(u, o); feito = true; await preparar(p, srv, []); const hash = (u.match(/#.*/) || [''])[0]; const r = await g(u.replace(/#.*/, ''), o); await logar(p, 'u' + (++n) + '@fenix.com'); if (hash) await p.evaluate(h => location.hash = h, hash); return r; };
      return p; }; return c; }; return b; };
