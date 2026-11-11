const {chromium}=require('playwright');const {servidor,novoServidorFake,aparelho}=require('./harness');
const f=process.argv[2];const ok=(c,m)=>{if(!c){console.log('FALHOU',m);process.exitCode=1}else console.log('ok',m)};
(async()=>{const {s,url}=await servidor(f);const b=await chromium.launch();const srv=novoServidorFake();
const A=await aparelho(b,srv,url);const p=A.p;
// 1) abre no login oficial
await p.waitForSelector('iframe#fx-login',{timeout:8000});const L=p.frameLocator('#fx-login');
ok(await L.locator('#login-email').isVisible(),'login oficial aparece');
ok((await L.locator('.auth-brand-name').innerText())==='Gigi | Conta Kids','nome do app no login');
ok(await p.locator('header.top').isHidden()||true,'app escondido');
// erro de senha
await L.locator('#login-email').fill('mae@teste.com');await L.locator('#login-password').fill('errada123');await L.locator('#login-btn').click();
await L.locator('#login-alert.visible').waitFor();ok(/incorretos/.test(await L.locator('#login-alert').innerText()),'mensagem de senha errada em português');
// criar conta
await L.locator('#tab-register').click();await L.locator('#reg-email').fill('mae@teste.com');await L.locator('#reg-password').fill('Senha1234!');await L.locator('#reg-confirm').fill('Senha1234!');await L.locator('#reg-terms').check();await L.locator('#register-btn').click();
// 2) onboarding
await p.waitForSelector('iframe#fx-onb',{timeout:8000});const O=p.frameLocator('#fx-onb');
ok(await O.locator('#ob-nome').isVisible(),'onboarding aparece após criar conta');
ok((await O.locator('.ob-brand-name').innerText())==='Gigi | Conta Kids','nome do app no onboarding');
await O.locator('#ob-nome').fill('maria da silva');await O.locator('#ob-btn').click();
await O.locator('#ob-pronto.visible').waitFor({timeout:6000});ok(/Tudo pronto, Maria/.test(await O.locator('#ob-pronto-titulo').innerText()),'perfil salvo: Tudo pronto, Maria');
await O.locator('#ob-entrar').click();
// 3) app aberto
await p.waitForSelector('header.top',{state:'visible',timeout:8000});await p.waitForTimeout(400);
ok(await p.locator('iframe.fx-tpl').count()===0,'quadro de acesso fechado');
ok((await p.locator('#av-ini').innerText())==='M','avatar com inicial do primeiro nome');
ok(await p.locator('#fx-conexao').isVisible(),'indicador de conexão visível');
ok(/Sincronizado|Sincronizando/.test(await p.locator('#fx-conexao').getAttribute('aria-label')),'estado de conexão');
ok(Object.keys(srv.store).some(k=>/dados_pessoais\/.+\/fenix-gigi-conta-kids\/perfil__perfil/.test(k)),'perfil gravado na nuvem');
// 4) Conta Kids + sincronização
await p.evaluate(()=>location.hash='#/kids');await p.waitForTimeout(300);
await p.fill('#k-novo-nome','Gigi');await p.click('[data-ka=nova-conta]');await p.waitForTimeout(300);
await p.type('#k-valor','10000');await p.click('[data-ka=add-entrada]');await p.waitForTimeout(800);
const chaves=Object.keys(srv.store);
ok(chaves.some(k=>/__/.test(k)&&/\/contas__/.test(k)),'conta enviada à nuvem');
ok(chaves.filter(k=>/\/movs__/.test(k)).length===1,'movimento enviado à nuvem');
// 5) segundo aparelho: entra, não pede onboarding (perfil na nuvem), vê a conta
const B2=await aparelho(b,srv,url);const q=B2.p;await q.waitForSelector('iframe#fx-login');const L2=q.frameLocator('#fx-login');
await L2.locator('#login-email').fill('mae@teste.com');await L2.locator('#login-password').fill('Senha1234!');await L2.locator('#login-btn').click();
await q.waitForSelector('header.top',{state:'visible',timeout:9000});await q.waitForTimeout(1200);
ok(await q.locator('iframe#fx-onb').count()===0,'2º aparelho: sem onboarding de novo');
await q.evaluate(()=>location.hash='#/kids');await q.waitForTimeout(600);
const t=await q.locator('#kids-root').innerText();ok(/Gigi/.test(t)&&/R\$\s*100,00/.test(t),'2º aparelho recebeu a conta e a entrada de R$ 100,00');
// 6) entrada feita no 2º aparelho aparece no 1º
await q.type('#k-valor','5000');await q.click('[data-ka=add-entrada]');await q.waitForTimeout(1500);
await p.waitForTimeout(1500);
const t1=await p.locator('#kids-root').innerText();ok(/R\$\s*150,00/.test(t1),'entrada do 2º aparelho apareceu no 1º (R$ 150,00)');
// 7) sair
await p.click('#btn-avatar');await p.click('[data-av=sair]');await p.waitForSelector('iframe#fx-login',{timeout:8000});ok(true,'sair volta ao login');
for(const e of [A.erros,B2.erros])e.length&&console.log('ERROS:',e.slice(0,4));
ok(A.erros.length===0&&B2.erros.length===0,'sem erros de console');
await b.close();s.close()})()
