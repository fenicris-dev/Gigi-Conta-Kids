# Manual — Gigi | Conta Kids (v1.6)

## 1. Painel
- O Painel tem duas partes (chave no alto): **1 · Simulador de cenários** e **2 · Aportes reais × previsão**.
- **1 · Simulador de cenários**: informe o tipo de aporte (Fixo = mesmo valor todo mês, ou Crescente = regra anual), o aporte e o rendimento mensal; escolha o período e veja indicadores, cards e gráficos.
- **2 · Aportes reais × previsão**: à esquerda, o que realmente está em caixa hoje; à direita, a previsão no período escolhido, usando a **média dos valores depositados** repetida todo mês (se houver entrada mensal manual em Conta Kids › Configurações, ela tem prioridade). Supõe que nada seja gasto; valores nominais, sem inflação nem impostos.
- **Período da projeção** (5 a 30 anos, ou “Outro período”): define a duração do cenário ativo. Indicadores, gráficos, tabela e calendário se atualizam na hora.
- **Indicadores** (clicáveis): patrimônio projetado, total aportado, rendimentos acumulados e juros do 1º mês do último ano. Tocar em um deles leva à tela com o detalhe.
- **Resultados por período**: escolha 5, 10, 15, 20, 25 e/ou 30 anos para ver um card de cada.

## 2. Parâmetros
- **Valor do primeiro aporte**: digite só números; 2500 vira R$ 25,00.
- **Data do primeiro aporte**: os demais aportes caem no mesmo dia dos meses seguintes (dia 29–31 vira o último dia do mês quando preciso; anos bissextos tratados).
- **Rentabilidade mensal (%)**: juros compostos, rendimentos reinvestidos. Aceita vírgula (ex.: 0,8).
- **Duração (anos)**: de 1 a 100.
- **Frequência**: mensal, bimestral, trimestral, quadrimestral, semestral ou anual. O valor de cada depósito segue a regra de crescimento do ano.
- **Momento do aporte**: no *fim* do período o aporte não rende no próprio período; no *início* já rende.
- **Regra de crescimento**: aumento do ano 2, redução anual em pontos percentuais, mínimo, ano de início da redução e limite máximo opcional. O percentual incide sobre o aporte do ano anterior.
- **Restaurar parâmetros iniciais**: volta o cenário ativo ao padrão (R$ 25,00, 1% ao mês, 30 anos).

## 3. Gráficos
1. Composição do patrimônio (aportes × rendimentos). 2. Evolução do patrimônio (anual/mensal). 3. Crescimento dos aportes. 4. Juros gerados (mensal/anual).
Passe o mouse ou toque no gráfico para ver os valores.

## 4. Evolução anual
Tabela com 10 colunas; toque no título da coluna para ordenar e use a busca para filtrar. No celular, cada ano vira um cartão.

## 5. Cenários
Crie a partir de Padrão, Conservador, Moderado, Agressivo ou de uma cópia. Esses nomes são só conjuntos de parâmetros editáveis. Marque “Comparar” em até 3.

## 6. Calendário financeiro
Cada ano abre para mostrar data, aporte, juros e saldo de cada mês.

## 7. Conta Kids
- Para registrar um valor recebido (R$ 50, R$ 100, R$ 200… qualquer valor): abra **Conta Kids**, crie a conta da criança e use **Nova entrada** no topo da tela.
- Crie uma conta por criança. Cada **entrada** (data, valor, descrição) é dividida na hora: **50%** longo prazo, **10%** contribuição, **40%** uso livre. As porcentagens não mudam.
- **50% longo prazo**: fica como aplicado e intocável. Defina o objetivo e o tempo de guarda, em anos ou numa data, sempre a partir de 10 anos. O tempo conta da primeira entrada, não de cada aporte; depois do primeiro aporte só pode ser aumentado. Rende o percentual mensal das configurações.
- **Instituição financeira**: em **Instituições financeiras** cadastre os bancos onde os 50% são guardados (ex.: Nubank, Caixa). Ao registrar um valor, escolha a instituição; a escolha fica lembrada para a próxima entrada. O card dos 50% mostra quanto foi guardado em cada uma e o histórico indica onde cada aporte entrou. Uma instituição com aportes não pode ser removida, mas pode ser renomeada.
- **10% contribuição**: sai para um terceiro no momento da entrada (ex.: ajudar em casa); não fica saldo.
- **40% uso livre**: sem rendimento. Só dá para gastar o que já entrou; sem saldo, é esperar a próxima entrada.
- **Caixinhas** (dentro dos 40%): informe o objetivo, o valor do produto, quanto % do bem quer pagar e qual % dos 40% vai para ela. A caixinha rende e mostra quanto tempo poupar (informe a entrada mensal prevista em Configurações). Guarda até atingir a meta ou até uma data. **Encerrar** devolve o saldo ao uso livre.
- **Histórico**: remover um movimento só é permitido se nenhum gasto ficar sem saldo. **Baixar conta (.json)** exporta tudo.

## 8. Exportar e dados
- **JSON**: parâmetros, resumo, tabela anual e todos os meses, com números puros.
- **CSV**: separador “;”, sem milhar e sem “R$”; escolha vírgula ou ponto como decimal.
- **Relatório PDF / Imprimir**: abre a impressão com o relatório pronto; escolha “Salvar como PDF”.
- **Limpar dados salvos**: exige digitar APAGAR.

Aviso: esta ferramenta apresenta projeções matemáticas baseadas nos parâmetros informados. Os resultados não representam garantia de rentabilidade futura e não consideram automaticamente impostos, taxas ou inflação.
