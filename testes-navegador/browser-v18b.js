const {chromium}=require('playwright');const fs=require('fs');const {servidor,novoServidorFake,aparelho}=require('./harness');
const f=process.argv[2];const ok=(c,m)=>{if(!c){console.log('FALHOU',m);process.exitCode=1}else console.log('ok',m)};
async function entrar(p,email){await p.waitForSelector('iframe#fx-login',{timeout:8000});const L=p.frameLocator('#fx-login');await L.locator('#tab-register').click();await L.locator('#reg-email').fill(email);await L.locator('#reg-password').fill('Senha1234!');await L.locator('#reg-confirm').fill('Senha1234!');await L.locator('#reg-terms').check();await L.locator('#register-btn').click();
 await p.waitForSelector('iframe#fx-onb',{timeout:8000});const O=p.frameLocator('#fx-onb');await O.locator('#ob-nome').fill('Ana');await O.locator('#ob-btn').click();await O.locator('#ob-pronto.visible').waitFor();await O.locator('#ob-entrar').click();await p.waitForSelector('header.top',{state:'visible'});await p.waitForTimeout(300);}
(async()=>{const {s,url}=await servidor(f);const b=await chromium.launch();const srv=novoServidorFake();
const A=await aparelho(b,srv,url);const p=A.p;await entrar(p,'ana@teste.com');
// conta com instituição e entradas
await p.evaluate(()=>location.hash='#/kids');await p.waitForTimeout(300);
await p.fill('#k-novo-nome','Gigi');await p.click('[data-ka=nova-conta]');await p.waitForTimeout(200);
await p.type('#k-valor','10000');await p.click('[data-ka=add-entrada]');await p.waitForTimeout(300);await p.type('#k-valor','5000');await p.click('[data-ka=add-entrada]');await p.waitForTimeout(300);
// Painel Kids: indicadores clicáveis
await p.evaluate(()=>location.hash='#/painel');await p.waitForTimeout(300);await p.click('#seg-fonte [data-fonte=kids]');await p.waitForTimeout(300);
const ind=p.locator('[data-pki=dif]');ok(await ind.count()===1,'indicador "Crescimento previsto" clicável');
await ind.click();await p.waitForTimeout(200);const painel=await p.locator('#pk-lanc').innerText();
const nums=[...painel.matchAll(/R\$\s*([\d.]+,\d{2})/g)].slice(1).map(m=>parseFloat(m[1].replace(/\./g,'').replace(',','.')));
const alvo=parseFloat((await ind.locator('.v').innerText()).replace(/[^\d,]/g,'').replace(',','.'));
ok(nums.length===3&&Math.abs(nums.reduce((a,c)=>a+c,0)-alvo)<0.011,'lançamentos somam o valor clicado ('+nums.join(' + ')+' = '+alvo+')');
await p.locator('[data-pki-fechar]').click();ok(await p.locator('#pk-lanc').count()===0,'Fechar recolhe a lista');
// Sobre (core)
await p.evaluate(()=>location.hash='#/sobre');await p.waitForTimeout(500);
const sobre=await p.locator('#fx-sobre').innerText();
ok(/Versão\s*\n?v1\.8/.test(sobre)||/v1\.8/.test(sobre),'Sobre mostra a versão v1.8');
ok(/Changelog/.test(sobre)&&/v1\.7/.test(sobre)&&/v1\.0/.test(sobre),'Changelog completo (v1.8 … v1.0)');
ok(/Criada em/.test(sobre)&&/Modificada em/.test(sobre),'datas de criação e modificação por versão');
ok(/Padrão: Livro das Regras Fênix v4\.8/.test(await p.locator('#fx-padrao').innerText()),'linha do Livro das Regras');
ok(/c 4\.8/.test(sobre),'selo c 4.8 na Sobre');
ok(await p.locator('#sob-pref select').count()===1,'preferências com seletor de Tema (grupo J)');
ok(/Acessos/.test(sobre),'contagem de acessos');
await p.locator('summary:has-text("Manual do usuário")').click();
ok(/Painel/.test(await p.locator('#fx-manual').innerText()),'manual do core exibido');
// tema escuro
await p.selectOption('#sob-pref select','escuro');await p.waitForTimeout(200);
ok(await p.evaluate(()=>document.documentElement.getAttribute('data-tema'))==='escuro','tema escuro aplicado no <html>');
const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);ok(bg==='rgb(2, 7, 51)','fundo escuro oficial #020733 ('+bg+')');
await p.screenshot({path:'/tmp/claude-0/escuro-sobre.png'});
await p.evaluate(()=>location.hash='#/painel');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/escuro-painel.png'});
await p.evaluate(()=>{document.documentElement.setAttribute('data-tema','claro');localStorage.setItem('fenix_tema','claro')});
// backup / restaurar
await p.evaluate(()=>location.hash='#/exportar');await p.waitForTimeout(300);
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-bk=baixar]')]);const nome=dl.suggestedFilename();ok(/^fenix-gigi-conta-kids-backup-\d{4}-\d{2}-\d{2}\.json$/.test(nome),'nome do backup: '+nome);
const caminho=await dl.path();const bk=JSON.parse(fs.readFileSync(caminho,'utf8'));ok(bk.app==='fenix-gigi-conta-kids'&&bk.dados.contas.length===1&&bk.dados.contas[0].movs.length===2,'backup traz conta e 2 movimentos');
ok(!('donoUid' in bk.dados),'backup sem dado interno de conta de usuário');
// apaga a conta localmente e restaura
await p.evaluate(()=>{const S=window.FenixAportes.estado();S.contas.length=0;S.contaId=null;});
await p.setInputFiles('#bk-file',caminho);await p.waitForSelector('#modal.on, #modal[open], .modal.on',{timeout:3000}).catch(()=>{});
await p.fill('#modal-in','APAGAR');await p.click('#modal-ok');await p.waitForTimeout(600);
ok(await p.evaluate(()=>window.FenixAportes.estado().contas.length)===1,'restauração trouxe a conta de volta');
const ruim='/tmp/claude-0/bk-ruim.json';fs.writeFileSync(ruim,JSON.stringify({app:'outro',tipo:'backup',dados:{}}));
await p.setInputFiles('#bk-file',ruim);await p.waitForTimeout(300);ok(/não é um backup/.test(await p.locator('#toast').innerText()),'backup de outro app recusado');
// offline: edita offline e sobe quando volta
await p.evaluate(()=>{window.__fakeOffline=true;});await p.context().setOffline(true);await p.waitForTimeout(300);
ok((await p.locator('#fx-conexao').getAttribute('data-estado'))==='offline','indicador mostra offline');
await p.evaluate(()=>location.hash='#/kids');await p.waitForTimeout(300);await p.type('#k-valor','2000');await p.click('[data-ka=add-entrada]');await p.waitForTimeout(400);
const antes=Object.keys(srv.store).filter(k=>/\/movs__/.test(k)).length;
await p.context().setOffline(false);await p.evaluate(()=>{window.__fakeOffline=false;window.dispatchEvent(new Event('online'));});await p.waitForTimeout(2500);
const depois=Object.keys(srv.store).filter(k=>/\/movs__/.test(k)).length;ok(depois===antes+1,'entrada feita offline subiu ao voltar a internet ('+antes+' → '+depois+')');
ok(A.erros.length===0,'sem erros de console '+A.erros.join('|'));
await b.close();s.close()})()
