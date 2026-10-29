/* Testes automatizados do motor — uso: node fenix-aportes-testes.js <arquivo.html ou engine.js> */
var fs = require('fs'), assert = require('assert');
var src = fs.readFileSync(process.argv[2], 'utf8');
var a = src.indexOf('/* MÓDULOS PUROS'), b = src.indexOf('/* FIM MÓDULOS PUROS */');
var code = src.slice(a, b);
var M = new Function(code + '; return {D:AporteDatas,G:AporteCrescimento,M:AporteMotor,K:ContaKids};')();
var ok = 0, fail = 0;
function t(nome, fn) { try { fn(); ok++; console.log('  ✔ ' + nome); } catch (e) { fail++; console.log('  ✘ ' + nome + '\n     ' + e.message); } }
function perto(x, y, tol, msg) { var d = Math.abs(x - y); assert(d <= (tol || 1e-6) * Math.max(1, Math.abs(y)), (msg || '') + ' obtido ' + x + ' esperado ' + y); }

var P = M.M.padrao();
var R = M.M.simular(P);

console.log('Testes obrigatórios (seção 15 do prompt mestre)');
t('1. primeiro aporte é R$ 25,00', function () { assert.strictEqual(R.months[0].deposit, 25); assert.strictEqual(R.years[0].deposit, 25); });
t('2. ano 2 usa aumento de 50%', function () { assert.strictEqual(R.years[1].increasePct, 50); perto(R.years[1].deposit, 37.5); });
t('3. ano 3 usa aumento de 47%', function () { assert.strictEqual(R.years[2].increasePct, 47); perto(R.years[2].deposit, 37.5 * 1.47); });
t('4. percentual cai 3 p.p. por ano até 5%', function () {
  for (var y = 3; y <= 16; y++) assert.strictEqual(R.years[y - 1].increasePct, 56 - 3 * y, 'ano ' + y);
  assert.strictEqual(R.years[3].increasePct, 44); assert.strictEqual(R.years[4].increasePct, 41);
  assert.strictEqual(R.years[16].increasePct, 5, 'ano 17 = 5%');
});
t('5. percentual permanece em 5% depois', function () { for (var y = 17; y <= 30; y++) assert.strictEqual(R.years[y - 1].increasePct, 5); });
t('6. cada ano tem 12 aportes mensais', function () { R.years.forEach(function (a) { assert.strictEqual(a.depositsCount, 12); }); assert.strictEqual(R.months.length, 360); });
t('7. juros sobre o saldo anterior ao aporte do mês', function () {
  R.months.forEach(function (m) { perto(m.interest, m.openBalance * 0.01, 1e-12); perto(m.closeBalance, m.openBalance + m.interest + m.deposit, 1e-12); });
  assert.strictEqual(R.months[0].interest, 0);
});
t('8. total aportado não inclui rendimentos', function () {
  var s = 0; R.months.forEach(function (m) { s += m.deposit; });
  perto(R.summary.totalDeposited, s, 1e-12);
  perto(R.summary.totalDeposited, R.years.reduce(function (x, a) { return x + 12 * a.deposit; }, 0), 1e-12);
});
t('9. rendimentos = patrimônio final − total aportado', function () {
  perto(R.summary.totalInterest, R.summary.patrimony - R.summary.totalDeposited, 1e-12);
  perto(R.summary.totalInterest, R.months.reduce(function (x, m) { return x + m.interest; }, 0), 1e-9);
});
t('10. juros do 1º mês do ano = 1% do saldo anterior ao aporte', function () {
  R.years.forEach(function (a, i) {
    var prev = i === 0 ? 0 : R.years[i - 1].closeBalance;
    perto(a.openBalance, prev, 1e-12); perto(a.firstMonthInterest, prev * 0.01, 1e-12);
  });
});
t('11. cards, tabela anual e meses consistentes', function () {
  [5, 10, 20, 30].forEach(function (h) {
    var s = M.M.instantaneo(R, h), a = R.years[h - 1], m = R.months[h * 12 - 1];
    assert.strictEqual(s.patrimony, a.closeBalance); assert.strictEqual(s.patrimony, m.closeBalance);
    assert.strictEqual(s.totalDeposited, m.cumDeposits); assert.strictEqual(s.firstMonthInterestLastYear, a.firstMonthInterest);
  });
});
t('12. alterar parâmetros altera os resultados', function () {
  var q = M.M.padrao(); q.initialDeposit = 50; var r2 = M.M.simular(q);
  perto(r2.summary.patrimony, R.summary.patrimony * 2, 1e-9);
  q = M.M.padrao(); q.ratePct = 2; assert(M.M.simular(q).summary.patrimony > R.summary.patrimony);
  q = M.M.padrao(); q.years = 10; assert.strictEqual(M.M.simular(q).months.length, 120);
  q = M.M.padrao(); q.growth.initialIncrease = 10; assert(M.M.simular(q).summary.patrimony < R.summary.patrimony);
});
t('13. precisão interna (sem arredondar no meio) — soma exata em centavos só na apresentação', function () {
  assert(Math.abs(R.years[1].deposit - 37.5) < 1e-12); assert(R.years[2].deposit !== Math.round(R.years[2].deposit * 100) / 100);
});
t('14a. 10/20/30 anos vs referência exata (Fraction/Python), padrão', function () {
  perto(R.years[9].closeBalance, 30539.608562438716); perto(R.years[19].closeBalance, 305190.52701585926); perto(R.years[29].closeBalance, 1379085.1456148163);
  perto(R.years[9].cumDeposited, 20995.132497771014); perto(R.years[19].cumDeposited, 137104.9069186285); perto(R.years[29].cumDeposited, 340498.22196921974);
  perto(R.years[9].deposit, 447.3807041631312); perto(R.years[29].deposit, 2090.505144162067);
});
t('14b. referência exata com outros parâmetros (taxa 0,8%, teto 20%, mín 3%, redução 2)', function () {
  var q = M.M.padrao(); q.initialDeposit = 100; q.ratePct = 0.8; q.years = 25; q.growth = { initialIncrease: 30, reduction: 2, minIncrease: 3, reductionStartYear: 3, maxIncrease: 20 };
  var r = M.M.simular(q);
  perto(r.years[9].closeBalance, 44168.31016107729); perto(r.years[24].closeBalance, 463554.19676377607);
  perto(r.years[9].cumDeposited, 30223.2060051456); perto(r.years[24].cumDeposited, 163741.1610796049); perto(r.years[24].deposit, 918.4980509809326);
  assert.strictEqual(r.years[1].increasePct, 20, 'ano 2 limitado pelo teto');
});
t('14c. aporte no início do período vs referência exata', function () {
  var q = M.M.padrao(); q.initialDeposit = 50; q.ratePct = 1.5; q.years = 12; q.timing = 'inicio';
  var r = M.M.simular(q); perto(r.years[11].closeBalance, 145277.6116503887); perto(r.years[11].cumDeposited, 71044.95744671242);
  assert(r.months[0].interest > 0, 'no início, o 1º aporte já rende');
});

console.log('Extras');
t('datas: dia 20 em todos os aportes; ano bissexto; 31 → fim do mês', function () {
  assert.strictEqual(R.months[0].date, '2026-10-20'); assert.strictEqual(R.months[359].date, '2056-09-20');
  assert(R.months.every(function (m) { return m.date.slice(8) === '20'; }));
  assert.strictEqual(M.M.instantaneo(R, 10).endDate, '2036-10-20'); assert.strictEqual(R.years[0].endDate, '2027-10-19');
  var q = M.M.padrao(); q.startDate = '2027-12-31'; q.years = 2; var r = M.M.simular(q);
  assert.deepStrictEqual(r.months.slice(0, 4).map(function (m) { return m.date; }), ['2027-12-31', '2028-01-31', '2028-02-29', '2028-03-31']);
  assert.strictEqual(r.months[14].date, '2029-02-28'); assert.strictEqual(r.months[11].date, '2028-11-30');
  q.startDate = '2028-02-29'; assert.strictEqual(M.M.simular(q).months[12].date, '2029-02-28');
  assert.strictEqual(M.D.parseISO('2026-02-29'), null); assert.notStrictEqual(M.D.parseISO('2028-02-29'), null);
});
t('frequência trimestral: 4 aportes/ano', function () {
  var q = M.M.padrao(); q.frequencyMonths = 3; q.years = 3; var r = M.M.simular(q);
  r.years.forEach(function (a) { assert.strictEqual(a.depositsCount, 4); });
  assert.strictEqual(r.months[0].deposit > 0, true); assert.strictEqual(r.months[1].deposit, 0); assert.strictEqual(r.months[3].deposit > 0, true);
});
t('limites 1 e 50 anos (e 100) funcionam', function () {
  [1, 50, 100].forEach(function (n) { var q = M.M.padrao(); q.years = n; var r = M.M.simular(q); assert.strictEqual(r.years.length, n); assert(isFinite(r.summary.patrimony)); });
});
t('validação rejeita negativos e inválidos', function () {
  function inv(f) { var q = M.M.padrao(); f(q); assert(M.M.validar(q).length > 0); assert.throws(function () { M.M.simular(q); }); }
  inv(function (q) { q.initialDeposit = -1; }); inv(function (q) { q.ratePct = -0.1; }); inv(function (q) { q.ratePct = NaN; });
  inv(function (q) { q.years = 0; }); inv(function (q) { q.years = 101; }); inv(function (q) { q.years = 2.5; });
  inv(function (q) { q.startDate = '2026-13-01'; }); inv(function (q) { q.growth.reduction = -1; }); inv(function (q) { q.timing = 'x'; });
  inv(function (q) { q.growth.reductionStartYear = 1; }); inv(function (q) { q.frequencyMonths = 5; });
});
t('taxa 0%: sem rendimento', function () { var q = M.M.padrao(); q.ratePct = 0; q.years = 3; var r = M.M.simular(q); perto(r.summary.totalInterest, 0, 1e-12); perto(r.summary.patrimony, r.summary.totalDeposited, 1e-12); });
t('regra de crescimento: início da redução no ano 5', function () {
  var g = { initialIncrease: 50, reduction: 3, minIncrease: 5, reductionStartYear: 5, maxIncrease: null };
  assert.deepStrictEqual([2, 3, 4, 5, 6].map(function (y) { return M.G.pctDoAno(y, g); }), [50, 50, 50, 47, 44]);
});


console.log('Conta Kids (divisão 50/10/40)');
var K = M.K;
function conta0() { var c = K.novaConta('Sobrinho'); c.cfg.entradaMensal = 500; return c; }
var _id = 0;
function entrada(c, date, reais) { var cc = K.cents(reais); c.movs.push({ id: 'm' + (++_id), type: 'entrada', date: date, cents: cc, desc: '', split: K.dividir(cc, c.caixas.filter(function (b) { return !b.encerrada; })) }); }
function caixa(c, nome, meta, pct, guarda) { var b = { id: 'b' + (++_id), nome: nome, meta: meta, pct: pct, guarda: guarda || { modo: 'meta', data: '' }, criada: '2026-10-01' }; c.caixas.push(b); return b; }
t('K1. R$ 100 → 50 / 10 / 40, sem sobrar nem faltar centavo', function () {
  var d = K.dividir(10000, []); assert.deepStrictEqual([d.lt, d.dn, d.livre], [5000, 1000, 4000]);
  for (var c = 1; c <= 20000; c += 7) { var x = K.dividir(c, [{ id: 'a', pct: 33 }, { id: 'b', pct: 17 }]); assert.strictEqual(x.lt + x.dn + x.livre + x.caixas.a + x.caixas.b, c, 'c=' + c); assert(x.livre >= 0 && x.dn >= 0 && x.lt >= 0); }
});
t('K2. caixinhas recebem % dos 40% (25% e 15% de R$ 40 = R$ 10 e R$ 6)', function () {
  var d = K.dividir(10000, [{ id: 'a', pct: 25 }, { id: 'b', pct: 15 }]); assert.strictEqual(d.caixas.a, 1000); assert.strictEqual(d.caixas.b, 600); assert.strictEqual(d.livre, 2400);
});
t('K3. consolidar: longo 50, doação 10 (repassada), livre 40', function () {
  var c = conta0(); entrada(c, '2026-10-10', 100); var k = K.consolidar(c, '2026-10-27');
  perto(k.longo.saldo, 50, 1e-12); perto(k.doacao.repassado, 10, 1e-12); perto(k.livre.saldo, 40, 1e-12); assert.strictEqual(k.longo.juros, 0);
});
t('K4. juros do longo prazo vs fórmula fechada (12 entradas de R$ 100, 1% a.m.)', function () {
  var c = conta0(); for (var m = 1; m <= 12; m++) entrada(c, '2026-' + (m < 10 ? '0' : '') + m + '-15', 100);
  var k = K.consolidar(c, '2027-01-20'); var esperado = 50 * (Math.pow(1.01, 12) - 1) / 0.01;
  perto(k.longo.saldo, esperado, 1e-9); perto(k.longo.depositado, 600, 1e-12); perto(k.longo.juros, esperado - 600, 1e-9);
  perto(k.livre.saldo, 480, 1e-12, 'livre não rende'); assert.strictEqual(k.livre.saldo, 480);
});
t('K5. livre só rende dentro de caixinha: 40% sem caixinha = sem juros; com caixinha = com juros', function () {
  var c = conta0(); var b = caixa(c, 'Tênis', 1000, 50); for (var m = 1; m <= 6; m++) entrada(c, '2026-0' + m + '-10', 100);
  var k = K.consolidar(c, '2026-07-15'), cx = k.caixas[0];
  perto(k.livre.saldo, 6 * 20, 1e-12); perto(cx.depositado, 120, 1e-12);
  perto(cx.saldo, 20 * (Math.pow(1.01, 6) - 1) / 0.01, 1e-9); assert(cx.juros > 0);
});
t('K6. tempo da meta bate com a fórmula fechada', function () {
  var c = conta0(); var b = caixa(c, 'Tênis', 1000, 50); var tm = K.consolidar(c, '2026-10-27').caixas[0].tempo; // contrib = 500*0,4*0,5 = 100
  var n = Math.ceil(Math.log(1 + 1000 * 0.01 / 100) / Math.log(1.01)); assert.strictEqual(tm.meses, n);
  c.cfg.rateCaixa = 0; assert.strictEqual(K.consolidar(c, '2026-10-27').caixas[0].tempo.meses, 10);
  c.cfg.entradaMensal = 0; assert.strictEqual(K.consolidar(c, '2026-10-27').caixas[0].tempo, null);
});
t('K7. guarda do longo prazo: mínimo 10 anos; conta a partir do 1º aporte, não de cada um', function () {
  var c = conta0(); assert.notStrictEqual(K.validarGuardaLongo({ modo: 'anos', anos: 5 }, c, '2026-10-27'), '');
  assert.strictEqual(K.validarGuardaLongo({ modo: 'anos', anos: 10 }, c, '2026-10-27'), '');
  assert.notStrictEqual(K.validarGuardaLongo({ modo: 'data', data: '2036-10-26' }, c, '2026-10-27'), '');
  assert.strictEqual(K.validarGuardaLongo({ modo: 'data', data: '2036-10-27' }, c, '2026-10-27'), '');
  entrada(c, '2026-10-10', 100); entrada(c, '2030-05-05', 100);
  assert.strictEqual(K.consolidar(c, '2031-01-01').longo.liberacao, '2036-10-10');
  assert.strictEqual(K.consolidar(c, '2036-10-09').longo.liberado, false); assert.strictEqual(K.consolidar(c, '2036-10-10').longo.liberado, true);
  c.longo.guarda = { modo: 'data', data: '2037-10-10' }; assert.strictEqual(K.consolidar(c, '2031-01-01').longo.liberacao, '2037-10-10');
});
t('K8. depois do 1º aporte a guarda só pode aumentar', function () {
  var c = conta0(); entrada(c, '2026-10-10', 100);
  assert.notStrictEqual(K.validarMudancaGuarda({ modo: 'anos', anos: 10 }, { cfg: c.cfg, longo: { guarda: { modo: 'anos', anos: 20 } }, movs: c.movs, caixas: [] }, '2026-10-27'), '');
  c.longo.guarda = { modo: 'anos', anos: 10 }; assert.strictEqual(K.validarMudancaGuarda({ modo: 'anos', anos: 20 }, c, '2026-10-27'), '');
  assert.strictEqual(K.validarMudancaGuarda({ modo: 'anos', anos: 10 }, c, '2026-10-27'), '');
});
t('K9. gasto: só até o saldo (ficar sem comprar é a lição); caixinha trancada bloqueia', function () {
  var c = conta0(); var b = caixa(c, 'Tênis', 100, 100); entrada(c, '2026-10-10', 100); // livre 0, caixinha 40
  assert.notStrictEqual(K.validarGasto(c, null, 100, '2026-10-27'), '', 'livre vazio');
  assert.notStrictEqual(K.validarGasto(c, b.id, 1000, '2026-10-27'), '', 'caixinha trancada (meta 100, tem 40)');
  entrada(c, '2026-10-11', 200); // caixinha 120 >= 100
  assert.strictEqual(K.validarGasto(c, b.id, 5000, '2026-10-27'), ''); assert.notStrictEqual(K.validarGasto(c, b.id, 20000, '2026-10-27'), '');
  var dd = caixa(c, 'Presente', 50, 0.0001 > 1 ? 1 : 1, { modo: 'data', data: '2027-01-01' });
});
t('K10. validação de caixinha: soma ≤ 100% dos 40%, meta > 0, nome obrigatório', function () {
  var c = conta0(); caixa(c, 'A', 100, 60);
  assert.notStrictEqual(K.validarCaixinha({ nome: 'B', meta: 100, pct: 50, guarda: { modo: 'meta' } }, c), '');
  assert.strictEqual(K.validarCaixinha({ nome: 'B', meta: 100, pct: 40, guarda: { modo: 'meta' } }, c), '');
  assert.notStrictEqual(K.validarCaixinha({ nome: '', meta: 100, pct: 10, guarda: { modo: 'meta' } }, c), '');
  assert.notStrictEqual(K.validarCaixinha({ nome: 'B', meta: 0, pct: 10, guarda: { modo: 'meta' } }, c), '');
  assert.notStrictEqual(K.validarCaixinha({ nome: 'B', meta: 10, pct: 10, guarda: { modo: 'data', data: 'x' } }, c), '');
});
t('K11. remover movimento só se não deixar saldo negativo', function () {
  var c = conta0(); entrada(c, '2026-10-10', 100); entrada(c, '2026-10-12', 100);   // livre: 40 + 40
  c.movs.push({ id: 'g1', type: 'gasto', date: '2026-10-20', cents: 3000, boxId: null, desc: 'x' });
  assert.strictEqual(K.podeRemover(c, c.movs[0].id), true, 'sobra 40 - 30 = 10');
  c.movs.push({ id: 'g2', type: 'gasto', date: '2026-10-21', cents: 5000, boxId: null, desc: 'y' });   // total gasto 80
  assert.strictEqual(K.podeRemover(c, c.movs[0].id), false, 'sobraria 40 - 80 < 0');
  assert.strictEqual(K.podeRemover(c, 'g2'), true, 'remover o gasto sempre é possível');
});
t('K12. 10% nunca vira saldo e as 3 partes somam a entrada', function () {
  var c = conta0(); caixa(c, 'A', 500, 30); [33.33, 100, 0.07, 12345.67].forEach(function (v, i) { entrada(c, '2026-10-0' + (i + 1), v); });
  var k = K.consolidar(c, '2026-10-27'), cx = k.caixas[0];
  perto(k.longo.saldo + k.doacao.repassado + k.livre.saldo + cx.saldo, k.totalEntradas, 1e-12);
});
t('K13. projeção do longo prazo a partir do saldo real (sem e com entrada mensal)', function () {
  var c = conta0(); c.cfg.entradaMensal = 0; c.cfg.modoMensal = 'manual'; c.cfg.rateLongo = 1; entrada(c, '2026-10-27', 1220);
  var p = K.projetarLongo(c, '2026-10-28', 10); perto(p.saldo, 610 * Math.pow(1.01, 120), 1e-12); assert.strictEqual(p.data, '2036-10-28'); perto(p.depositado, 610, 1e-12); perto(p.juros, 610 * Math.pow(1.01, 120) - 610, 1e-9);
  c.cfg.entradaMensal = 100; var q = K.projetarLongo(c, '2026-10-28', 10), g = Math.pow(1.01, 120);
  perto(q.saldo, 610 * g + 50 * (g - 1) / 0.01, 1e-12); perto(q.depositado, 610 + 50 * 120, 1e-12); perto(q.contribuicao, 122 + 10 * 120, 1e-12);
  c.cfg.rateLongo = 0; perto(K.projetarLongo(c, '2026-10-28', 5).saldo, 610 + 50 * 60, 1e-12);
});
t('K14. previsão usa a MÉDIA das entradas repetida todo mês; real × previsão lado a lado', function () {
  var c = K.novaConta('G'); c.cfg.entradaMensal = 0; entrada(c, '2026-10-20', 100); entrada(c, '2026-10-25', 300);   // média 200
  perto(K.mediaEntradas(c), 200, 1e-12); assert.strictEqual(K.mensalEfetivo(c).origem, 'media');
  var p = K.projetarConta(c, '2026-10-28', 1), g = Math.pow(1.01, 12);
  perto(p.mensal, 200, 1e-12); perto(p.real.entrou, 400, 1e-12); perto(p.real.longo, 200, 1e-12); perto(p.real.quarenta, 160, 1e-12); perto(p.real.emCaixa, 360, 1e-12); perto(p.real.doacao, 40, 1e-12);
  perto(p.prev.longo, 200 * g + 100 * (g - 1) / 0.01, 1e-12); perto(p.prev.livre, 160 + 80 * 12, 1e-12); perto(p.prev.doacao, 40 + 20 * 12, 1e-12);
  perto(p.prev.entrou, 400 + 200 * 12, 1e-12); perto(p.prev.emCaixa, p.prev.longo + p.prev.livre, 1e-12);
  c.cfg.entradaMensal = 50; perto(K.projetarConta(c, '2026-10-28', 1).prev.entrou, 400 + 50 * 12, 1e-12);   // valor manual tem prioridade
  c.cfg.entradaMensal = 0; c.cfg.modoMensal = 'manual'; perto(K.projetarConta(c, '2026-10-28', 1).prev.entrou, 400, 1e-12);   // conta antiga: sem média
  assert.strictEqual(K.projetarConta(K.novaConta('vazia'), '2026-10-28', 10).prev.emCaixa, 0);
});
t('K15. previsão com caixinha: recebe sua parte dos 40% e rende; livre não rende', function () {
  var c = K.novaConta('G'); c.cfg.rateCaixa = 2; var b = caixa(c, 'Tênis', 500, 50); entrada(c, '2026-10-20', 100); // 40 → caixinha 20 + livre 20
  var p = K.projetarConta(c, '2026-10-28', 1), g = Math.pow(1.02, 12);
  perto(p.caixinhas[0].saldoHoje, 20, 1e-12); perto(p.caixinhas[0].saldo, 20 * g + 20 * (g - 1) / 0.02, 1e-12); perto(p.prev.livre, 20 + 20 * 12, 1e-12);
  perto(p.prev.quarenta, p.prev.livre + p.prev.caixinhas, 1e-12);
});
t('F1. aporte pré-fixado: mesmo valor todo mês, sem crescimento (referência de série geométrica)', function () {
  var q = M.M.padrao(); q.initialDeposit = 100; q.ratePct = 1; q.years = 10; q.growth.mode = 'fixo'; var r = M.M.simular(q), g = Math.pow(1.01, 120);
  perto(r.summary.patrimony, 100 * (g - 1) / 0.01, 1e-12); perto(r.summary.totalDeposited, 100 * 120, 1e-12);
  assert(r.years.every(function (a) { return a.deposit === 100 && a.increasePct === 0; })); assert(r.months.every(function (m) { return m.deposit === 100; }));
  q.growth.mode = 'crescente'; assert(M.M.simular(q).years[1].deposit > 100); q.growth.mode = 'x'; assert(M.M.validar(q).length > 0);
});

console.log('\n' + ok + ' passaram, ' + fail + ' falharam');
process.exit(fail ? 1 : 0);
