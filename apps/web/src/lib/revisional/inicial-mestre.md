# Petição Inicial — Ação Revisional de Financiamento de Veículo
## Modelo mestre com blocos condicionais

> **Como este arquivo funciona.** Cada bloco é delimitado por marcadores de
> abertura e fechamento — `BLOCO:` seguido do nome, entre colchetes duplos. O
> gerador (`lib/revisional/montar-inicial.ts`) liga apenas os blocos que o caso
> sustenta, a partir do `caminho` e das `teses` devolvidos por
> `decidirCaminho()`. Blocos marcados **sempre** entram em toda peça.
>
> Os campos entre chaves duplas são preenchidos a partir da ficha do caso.
>
> Os marcadores `EMENTA:` são lacunas para o ementário verificado. **Nenhuma
> ementa é escrita aqui**: acórdão só entra depois de conferido na fonte.
>
> As instruções acima não usam os marcadores literalmente, justamente para que o
> gerador não as confunda com conteúdo da peça.
>
> Toda referência legal traz a indicação do dispositivo. As súmulas e temas
> citados estão listados ao final, em "Citações a verificar", e passam pelo
> verificador antes de a peça ir para revisão.

---

[[BLOCO:enderecamento]] <!-- sempre -->

EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{vara}} VARA CÍVEL DA COMARCA DE {{comarca}}

{{cliente_nome}}, {{cliente_nacionalidade}}, {{cliente_estado_civil}}, {{cliente_profissao}}, portador(a) do RG nº {{cliente_rg}} e inscrito(a) no CPF sob o nº {{cliente_cpf}}, residente e domiciliado(a) à {{cliente_endereco}}, vem, por seu advogado que esta subscreve, com procuração anexa e endereço profissional à {{contratado_endereco}}, onde recebe intimações, com fundamento no Código de Defesa do Consumidor e nos artigos 319 e seguintes do Código de Processo Civil, propor a presente

**{{denominacao_acao}}**

em face de **{{banco_nome}}**, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {{banco_cnpj}}, com sede à {{banco_endereco}}, pelos fundamentos de fato e de direito a seguir expostos.

[[/BLOCO]]

---

[[BLOCO:gratuidade]] <!-- se pedeGratuidade -->

## I — PRELIMINARMENTE: DA GRATUIDADE DA JUSTIÇA

O(A) Autor(a) é pessoa natural cuja renda familiar mensal não lhe permite arcar com as custas processuais e as despesas do processo sem prejuízo do próprio sustento e do de sua família.

Nos termos do art. 99, § 3º, do Código de Processo Civil, presume-se verdadeira a alegação de insuficiência deduzida por pessoa natural, presunção que somente pode ser afastada mediante prova em contrário produzida nos autos.

Acompanha esta inicial declaração de hipossuficiência econômica firmada pelo(a) Autor(a), sob as penas da lei.

Requer, por isso, a concessão dos benefícios da gratuidade da justiça.

[[/BLOCO]]

---

[[BLOCO:fatos]] <!-- sempre -->

## II — DOS FATOS

Em {{contrato_data}}, o(a) Autor(a) celebrou com a Ré o contrato de financiamento nº {{contrato_numero}}, para aquisição de {{veiculo_descricao}}.

O bem foi adquirido pelo valor de {{veiculo_valor_avista}}, tendo o(a) Autor(a) pago {{valor_entrada}} a título de entrada. O montante efetivamente financiado foi de **{{valor_financiado}}**, a ser pago em {{total_parcelas}} parcelas mensais de {{valor_parcela}}, à taxa de juros de **{{taxa_contratada}} ao mês** — equivalente a {{taxa_contratada_anual}} ao ano.

Somadas todas as prestações, o(a) Autor(a) devolverá {{soma_parcelas}} pelo capital de {{valor_financiado}} — ou seja, **{{multiplicador}} vezes o valor financiado**.

[[SE:tem_encargos]]
Além dos juros, foram embutidas no financiamento as seguintes rubricas:

{{tabela_encargos}}

Os encargos somam **{{total_encargos}}**, o que corresponde a **{{percentual_encargos}} do valor financiado**.
[[/SE]]

O Custo Efetivo Total declarado no próprio instrumento é de **{{cet_mensal}} ao mês, {{cet_anual}} ao ano** — muito acima da taxa de juros nominal, diferença construída justamente pelas rubricas acima.

Até a presente data venceram {{parcelas_pagas}} das {{total_parcelas}} parcelas contratadas.

[[SE:inadimplente]]
Em razão do peso das prestações, o(a) Autor(a) encontra-se em atraso quanto a {{parcelas_em_atraso}} parcelas, situação que decorre diretamente da onerosidade excessiva ora impugnada.
[[/SE]]

Inconformado(a) com os encargos praticados, o(a) Autor(a) submeteu o contrato a análise técnica, cuja memória de cálculo acompanha esta inicial, e constatou as ilegalidades a seguir demonstradas.

[[/BLOCO]]

---

[[BLOCO:relacao_consumo]] <!-- sempre -->

## III — DO DIREITO

### III.1 — Da relação de consumo e da inversão do ônus da prova

A relação entre as partes é de consumo. O(A) Autor(a) é destinatário(a) final do serviço de concessão de crédito (CDC, art. 2º) e a Ré é fornecedora de serviços de natureza bancária e financeira (CDC, art. 3º, § 2º).

A incidência do Código de Defesa do Consumidor às instituições financeiras é matéria pacificada pela **Súmula 297 do Superior Tribunal de Justiça**.

Presentes a verossimilhança das alegações — demonstrada pela memória de cálculo anexa — e a hipossuficiência técnica do(a) Autor(a) diante da complexidade da matemática financeira empregada pela Ré, requer-se a **inversão do ônus da prova**, nos termos do art. 6º, VIII, do CDC.

Requer-se, ainda, que a Ré seja intimada a **exibir** o instrumento contratual integral, a planilha de evolução do saldo devedor e o demonstrativo de composição de cada rubrica cobrada, na forma dos arts. 396 a 400 do Código de Processo Civil, sob as cominações do art. 400.

### III.2 — Da possibilidade de revisão e do alcance do pedido

A revisão judicial de contrato bancário é admitida quando demonstrada a abusividade concreta das cláusulas impugnadas, não bastando a alegação genérica de onerosidade.

Registre-se, por oportuno, que nos termos da **Súmula 381 do Superior Tribunal de Justiça** é vedado ao julgador conhecer de ofício da abusividade das cláusulas em contrato bancário. Por essa razão, cada cobrança ora impugnada é individualizada nos tópicos seguintes e reproduzida, uma a uma, no capítulo dos pedidos.

[[/BLOCO]]

---

[[BLOCO:tese_juros]] <!-- se tese juros_acima_media -->

### III.3 — Da abusividade da taxa de juros remuneratórios

O contrato estipula juros remuneratórios de **{{taxa_contratada}} ao mês**, o que equivale a **{{taxa_contratada_anual}} ao ano**.

A taxa média de mercado divulgada pelo Banco Central do Brasil para a modalidade — *pessoas físicas, aquisição de veículos, recursos livres*, série 25471 — na competência {{competencia_bacen}}, mês da contratação, era de **{{taxa_media_bacen}} ao mês**, equivalente a {{taxa_media_bacen_anual}} ao ano. A consulta à base oficial acompanha esta inicial.

A taxa cobrada corresponde, portanto, a **{{multiplo_taxa}} vezes a média praticada pelo mercado** na mesma modalidade e no mesmo mês.

Não se ignora que, nos termos da **Súmula 382 do Superior Tribunal de Justiça**, a estipulação de juros superiores a 12% ao ano não indica abusividade por si só, nem que o **Tema 27 do Superior Tribunal de Justiça (REsp 1.061.530/RS)** exige demonstração concreta da abusividade em cada caso.

É exatamente essa demonstração que se faz aqui. Não se impugna a taxa por ser alta em abstrato, mas por destoar de forma expressiva da média praticada pelo próprio mercado bancário para a mesma operação, no mesmo período — discrepância que a jurisprudência reconhece como indicativa de abusividade quando supera em cerca de 50% a taxa média, patamar largamente ultrapassado no caso concreto.

[[EMENTA:juros_acima_media]]

Recalculado o contrato pela taxa média de mercado, mantidos todos os demais parâmetros, a prestação cairia de {{prestacao_cobrada}} para **{{prestacao_correta}}**, diferença de {{diferenca_prestacao}} por mês. Nas {{parcelas_pagas}} parcelas já vencidas, o(a) Autor(a) desembolsou **{{pago_a_maior}}** a mais do que deveria, e o saldo devedor remanescente está majorado em **{{reducao_saldo}}**.

[[/BLOCO]]

---

[[BLOCO:tese_cet]] <!-- se tese cet_divergente -->

### III.4 — Da divergência entre a taxa de juros e o Custo Efetivo Total

O instrumento declara juros de {{taxa_contratada}} ao mês e, no mesmo documento, Custo Efetivo Total de **{{cet_mensal}} ao mês** — {{cet_anual}} ao ano.

A diferença de {{spread_cet}} ao mês entre uma taxa e outra não decorre da remuneração do capital, mas das rubricas acessórias embutidas na operação. O dado é relevante por dois motivos.

Primeiro, porque evidencia que o custo real suportado pelo(a) consumidor(a) é substancialmente superior àquele que lhe foi apresentado como taxa de juros, o que compromete o dever de informação clara e adequada (CDC, art. 6º, III, e art. 46).

Segundo, porque confirma que as rubricas impugnadas nos tópicos seguintes não são acessórios de pequena monta, mas componentes que alteram materialmente a economia do contrato.

[[/BLOCO]]

---

[[BLOCO:tese_tarifa_cadastro]] <!-- se tese tarifa_cadastro -->

### III.5 — Da tarifa de cadastro

Foi cobrada do(a) Autor(a), sob a rubrica de cadastro, a quantia de **{{valor_tarifa_cadastro}}**.

O **Tema 620 do Superior Tribunal de Justiça** fixou que permanece válida a tarifa de cadastro expressamente tipificada em ato normativo padronizador da autoridade monetária, **a qual somente pode ser cobrada do início do relacionamento** entre o consumidor e a instituição financeira.

Não se impugna, portanto, a tarifa em abstrato. Impugna-se a ausência do requisito que a legitima. Requer-se que a Ré comprove documentalmente tratar-se do **início do relacionamento** do(a) Autor(a) com a instituição — ônus que lhe cabe por força da inversão requerida, por ser a única das partes que detém o histórico cadastral. Não comprovado o requisito, a cobrança é indevida.

Requer-se, ainda, que a Ré demonstre que a rubrica corresponde efetivamente a tarifa de cadastro tipificada pela autoridade monetária, e não a Tarifa de Abertura de Crédito sob outro nome. O **Tema 619 do Superior Tribunal de Justiça** assentou que, com a vigência da Resolução CMN 3.518/2007, em **30/04/2008**, a cobrança por serviços bancários prioritários ficou limitada às hipóteses taxativamente previstas em norma padronizadora, não tendo desde então respaldo legal a TAC, a TEC "ou outra denominação para o mesmo fato gerador".

Ainda que superados esses pontos, o valor cobrado — {{percentual_tarifa_cadastro}} do montante financiado — comporta o controle de onerosidade excessiva ressalvado pelo próprio Superior Tribunal de Justiça, por ser desproporcional ao serviço que remunera (CDC, art. 51, IV e § 1º, III).

[[EMENTA:tarifa_cadastro]]

[[/BLOCO]]

---

[[BLOCO:tese_tarifa_avaliacao]] <!-- se tese tarifa_avaliacao -->

### III.6 — Da tarifa de avaliação do bem

Sob a rubrica de avaliação, cobrou-se do(a) Autor(a) a quantia de **{{valor_tarifa_avaliacao}}**.

Reconhece-se, de início, que o **Tema 958 do Superior Tribunal de Justiça (REsp 1.578.553/SP)** firmou a **validade** da tarifa de avaliação do bem dado em garantia. A tese, contudo, ressalvou expressamente duas hipóteses de abusividade, e é em uma delas que se funda o pedido:

> *"2.3. Validade da tarifa de avaliação do bem dado em garantia [...] ressalvadas a: 2.3.1. abusividade da cobrança por serviço não efetivamente prestado; e a 2.3.2. possibilidade de controle da onerosidade excessiva, em cada caso concreto."*

Não se sustenta, portanto, que a tarifa seja ilegal em abstrato. Sustenta-se que, **neste caso concreto**, o serviço não foi prestado em favor da operação de crédito.

A rubrica do contrato indica tratar-se de avaliação do bem dado em **garantia da operação**. A garantia desta operação é o veículo financiado, gravado com alienação fiduciária — e não qualquer outro bem.

Requer-se, por isso, que a Ré seja intimada a **exibir o laudo de avaliação**, indicando qual bem foi avaliado, por quem, em que data e mediante qual metodologia. A prova é documental e está em poder exclusivo da Ré.

[[SE:avaliacao_pela_loja]]
Segundo informa o(a) Autor(a), a avaliação foi realizada pela própria revendedora, para formação do preço do veículo recebido em troca. Se assim for, o serviço aproveitou à compra e venda e ao interesse do lojista, e não à operação de crédito, de modo que seu custo não pode ser transferido ao consumidor sob rubrica que anuncia finalidade diversa.
[[/SE]]

Não exibido o laudo, ou demonstrando ele que o bem avaliado não é o que garante a operação, a cobrança é indevida e deve ser restituída.

[[EMENTA:tarifa_avaliacao]]

[[/BLOCO]]

---

[[BLOCO:tese_seguro]] <!-- se tese seguro_venda_casada -->

### III.7 — Do seguro: venda casada

Foi embutido no financiamento seguro no valor de **{{valor_seguro}}**, contratado junto a {{seguradora_nome}}.

O **Tema 972, item 2, do Superior Tribunal de Justiça** firmou tese de redação direta:

> *"Nos contratos bancários em geral, o consumidor não pode ser compelido a contratar seguro com a instituição financeira ou com seguradora por ela indicada."*

A tese não exige demonstração de vínculo societário entre a Ré e a seguradora. **Basta que a seguradora tenha sido indicada pela instituição financeira**, sem livre escolha do consumidor — o que é precisamente o caso: a seguradora consta pré-impressa no instrumento de adesão, sem que ao(à) Autor(a) fosse apresentada alternativa.

O(A) Autor(a) não escolheu a seguradora, não recebeu apólice, não foi informado(a) da cobertura contratada e tampouco teve oportunidade de recusar o produto ou de contratá-lo com terceiro. Configura-se a venda casada vedada pelo art. 39, I, do CDC.

[[SE:seguro_grupo_economico]]
Registre-se, a mais, que a seguradora indicada integra o mesmo grupo econômico da Ré — circunstância que reforça o quadro, embora a tese do Tema 972 dela não dependa.
[[/SE]]

[[SE:cnpj_seguradora_em_branco]]
Chama atenção, ademais, que o campo destinado ao CNPJ da seguradora foi entregue ao(à) consumidor(a) **sem preenchimento**, evidência concreta de que o seguro não foi objeto de negociação individual, mas de inserção padronizada em contrato de adesão.
[[/SE]]

[[EMENTA:seguro_venda_casada]]

[[/BLOCO]]

---

[[BLOCO:tese_registro]] <!-- se tese registro_contrato -->

### III.8 — Da tarifa de registro do contrato

Cobrou-se a quantia de **{{valor_registro}}** a título de registro do contrato junto ao órgão de trânsito.

O **Tema 958, item 2.3**, firmou a **validade** da cláusula que prevê o ressarcimento da despesa com o registro do contrato, ressalvadas a abusividade da cobrança por serviço não efetivamente prestado e o controle da onerosidade excessiva no caso concreto.

Opera-se, aqui, dentro dessas ressalvas. Requer-se que a Ré demonstre a realização do registro e o **valor efetivamente despendido** junto ao órgão de trânsito, restituindo-se ao(à) Autor(a) a diferença entre o cobrado e o custo real do ato — que é ressarcimento de despesa, não remuneração de serviço, e portanto não comporta margem.

[[/BLOCO]]

---

[[BLOCO:tese_servicos_terceiros]] <!-- se tese servicos_terceiros -->

### III.9 — Dos serviços de terceiros

Sob a rubrica genérica de serviços de terceiros, cobrou-se **{{valor_servicos_terceiros}}**.

O **Tema 958, item 2.1, do Superior Tribunal de Justiça** é direto quanto ao critério:

> *"Abusividade da cláusula que prevê a cobrança de ressarcimento de serviços prestados por terceiros, sem a especificação do serviço a ser efetivamente prestado."*

O que torna a cláusula abusiva, portanto, não é o mérito do serviço — é a **ausência de especificação**. E é exatamente esse o vício aqui: a rubrica não identifica o prestador, o serviço prestado nem o critério de formação do valor, impedindo que o(a) consumidor(a) saiba pelo que paga.

A redação genérica viola ainda o dever de informação (CDC, art. 6º, III) e esvazia o direito de escolha. Impõe-se a restituição.

[[/BLOCO]]

---

[[BLOCO:tese_capitalizacao]] <!-- se tese capitalizacao -->

### III.10 — Da capitalização de juros

A capitalização mensal de juros é admitida nos contratos bancários celebrados após 31 de março de 2000, **desde que expressamente pactuada** — entendimento consolidado na **Súmula 539 do Superior Tribunal de Justiça**, sendo suficiente, para tanto, que a taxa anual contratada supere o duodécuplo da mensal (**Súmula 541 do STJ**).

Não se impugna, portanto, a capitalização em si, mas a ausência de pactuação expressa e clara no instrumento, requisito de validade que cabe à Ré demonstrar.

[[/BLOCO]]

---

[[BLOCO:tese_comissao_permanencia]] <!-- se tese comissao_permanencia (contrato anterior a set/2017) -->

### III.11 — Da comissão de permanência

O contrato prevê comissão de permanência cumulada com {{encargos_cumulados}}.

A cumulação da comissão de permanência com juros remuneratórios, juros moratórios, multa e correção monetária é vedada, conforme **Súmulas 30, 294 e 472 do Superior Tribunal de Justiça**.

[[/BLOCO]]

---

[[BLOCO:tese_mora]] <!-- se tese descaracterizacao_mora -->

### III.12 — Da descaracterização da mora

A descaracterização da mora aqui postulada funda-se **exclusivamente na abusividade dos juros remuneratórios** — isto é, no encargo da normalidade contratual —, e não nas tarifas e no seguro impugnados nos tópicos anteriores.

A distinção é necessária e decorre da própria jurisprudência vinculante. O **Tema 28 do Superior Tribunal de Justiça (REsp 1.061.530/RS)** assentou que, verificada a abusividade dos encargos exigidos no **período da normalidade contratual**, descaracteriza-se a mora do devedor. Já o **Tema 972, item 3**, firmou que *"a abusividade de encargos acessórios do contrato não descaracteriza a mora"*.

Uma tese não contradiz a outra: encargo da normalidade é o juro remuneratório, que define quanto o consumidor deve; encargo acessório é a tarifa, que não altera a obrigação principal. É por isso que **somente a abusividade dos juros** é invocada neste capítulo.

Demonstrado que a taxa contratada de {{taxa_contratada}} ao mês destoa da média de mercado, o valor das prestações exigidas no período da normalidade era superior ao devido — e não há mora de quem foi cobrado a maior.

Não subsistindo a mora, não subsistem seus efeitos: inscrição em cadastros restritivos de crédito, vencimento antecipado da dívida e busca e apreensão do bem.

> **Nota ao revisor — não remover sem ler.** Este bloco só deve ser ligado quando
> a tese dos juros acima da média também estiver ligada. Sustentar
> descaracterização da mora com base em tarifa ou seguro contraria diretamente o
> Tema 972, item 3, e entrega à Ré um argumento de contestação.

[[/BLOCO]]

---

[[BLOCO:repeticao]] <!-- sempre -->

### III.13 — Da repetição do indébito

Reconhecida a abusividade das cobranças, impõe-se a restituição dos valores indevidamente pagos, com correção monetária desde cada desembolso e juros de mora desde a citação.

Requer-se a restituição **em dobro**, na forma do art. 42, parágrafo único, do Código de Defesa do Consumidor. A jurisprudência do Superior Tribunal de Justiça firmou que a devolução em dobro independe da demonstração de má-fé, bastando que a cobrança indevida decorra de conduta contrária à boa-fé objetiva — o que se verifica na hipótese, em que instituição financeira profissional impõe a consumidor leigo encargos que a própria jurisprudência já reputa abusivos.

Subsidiariamente, caso este Juízo entenda não configurados os requisitos da devolução em dobro, requer-se a restituição na forma **simples**, com os mesmos consectários.

[[/BLOCO]]

---

[[BLOCO:tutela]] <!-- se pedeTutela -->

## IV — DA TUTELA PROVISÓRIA DE URGÊNCIA

Estão presentes os requisitos do art. 300 do Código de Processo Civil.

A **probabilidade do direito** decorre da documentação que instrui a inicial: o próprio contrato da Ré demonstra a taxa aplicada, as rubricas cobradas e o Custo Efetivo Total, e a memória de cálculo anexa quantifica o excesso.

O **perigo de dano** é concreto e atual. {{fundamento_urgencia}}

Requer-se, por isso, que se determine à Ré que **se abstenha de inscrever o nome do(a) Autor(a) em cadastros restritivos de crédito** em razão do contrato discutido, e que **se abstenha de promover a busca e apreensão do veículo** enquanto pendente a discussão judicial dos encargos, sob pena de multa diária a ser arbitrada por este Juízo (CPC, art. 297, parágrafo único, e art. 537).

[[/BLOCO]]

---

[[BLOCO:consignacao]] <!-- se caminho C -->

## V — DA CONSIGNAÇÃO EM PAGAMENTO

O(A) Autor(a) não pretende furtar-se ao pagamento do que deve, mas apenas pagar o valor que entende correto.

Requer, por isso, autorização para depositar em juízo, nos vencimentos, o valor mensal de **{{prestacao_correta}}**, correspondente à prestação recalculada pela taxa média de mercado, na forma dos arts. 539 e seguintes do Código de Processo Civil.

Efetuados os depósitos, requer-se sejam reconhecidos como pagamento válido para todos os efeitos, afastando-se a mora quanto às parcelas consignadas.

[[/BLOCO]]

---

[[BLOCO:pedidos]] <!-- sempre -->

## VI — DOS PEDIDOS

Diante do exposto, requer:

[[SE:pedeGratuidade]]
**a)** a concessão dos benefícios da **gratuidade da justiça**, na forma do art. 99, § 3º, do CPC, conforme declaração anexa;
[[/SE]]

[[SE:pedeTutela]]
**b)** a concessão da **tutela provisória de urgência**, *inaudita altera parte*, para determinar que a Ré se abstenha de inscrever o nome do(a) Autor(a) em cadastros restritivos de crédito e de promover a busca e apreensão do veículo, sob pena de multa diária;
[[/SE]]

[[SE:querConsignar]]
**c)** seja deferida a **consignação em pagamento** das parcelas vincendas pelo valor de {{prestacao_correta}}, reconhecendo-se os depósitos como pagamento válido;
[[/SE]]

**d)** a **citação** da Ré, no endereço declinado, para responder à presente sob pena de revelia;

**e)** a **inversão do ônus da prova**, nos termos do art. 6º, VIII, do CDC;

**f)** que a Ré seja intimada a **exibir** o contrato integral, a planilha de evolução do saldo devedor e o demonstrativo de composição de cada rubrica cobrada, sob as cominações do art. 400 do CPC;

**g)** no mérito, a **procedência** dos pedidos, para:

{{lista_pedidos_meritorios}}

**h)** a condenação da Ré ao pagamento das **custas processuais e honorários advocatícios**, na forma do art. 85 do CPC;

**i)** a produção de todas as provas em direito admitidas, em especial documental, pericial contábil e depoimento pessoal do representante legal da Ré.

[[/BLOCO]]

---

[[BLOCO:valor_causa]] <!-- sempre -->

## VII — DO VALOR DA CAUSA

Dá-se à causa o valor de **{{valor_causa}}**, correspondente ao proveito econômico pretendido, assim composto:

{{composicao_valor_causa}}

O valor observa o art. 292, II e VI, do Código de Processo Civil, somando a restituição pretendida e a redução do saldo devedor postulada na revisão.

[[/BLOCO]]

---

[[BLOCO:fecho]] <!-- sempre -->

Nestes termos, pede deferimento.

{{local_assinatura}}, {{data_assinatura}}.

**{{contratado_nome}}**
OAB/{{contratado_oab_uf}} {{contratado_oab_numero}}

[[/BLOCO]]

---

## Citações a verificar

Antes de a peça ir para revisão, o verificador confere na fonte cada item abaixo.
Nenhum acórdão é citado neste mestre — as lacunas `[[EMENTA:*]]` são preenchidas
pelo ementário verificado.

| Referência | Onde aparece | Para quê |
|---|---|---|
| Súmula 297/STJ | III.1 | CDC aplica-se às instituições financeiras |
| Súmula 381/STJ | III.2 | vedado conhecer de ofício a abusividade |
| Súmula 382/STJ | III.3 | juros acima de 12% a.a. não são abusivos por si sós |
| Tema 27/STJ — REsp 1.061.530/RS | III.3 | abusividade dos juros exige demonstração concreta |
| Tema 28/STJ — REsp 1.061.530/RS | III.12 | abusividade **na normalidade** descaracteriza a mora |
| Tema 619/STJ | III.5 | TAC/TEC sem respaldo legal a partir de 30/04/2008 |
| Tema 620/STJ | III.5 | tarifa de cadastro válida, só no início do relacionamento |
| Tema 958/STJ — REsp 1.578.553/SP | III.6, III.8, III.9 | avaliação e registro **válidos** por regra; terceiros abusivos sem especificação |
| Tema 972/STJ — REsp 1.639.320/SP | III.7 | seguro: vedado impor instituição **ou seguradora por ela indicada** |
| Tema 972, item 3/STJ | III.12 | encargo **acessório** abusivo **não** descaracteriza a mora |
| Súmula 539/STJ | III.10 | capitalização mensal se expressamente pactuada |
| Súmula 541/STJ | III.10 | critério do duodécuplo |
| Súmulas 30, 294 e 472/STJ | III.11 | comissão de permanência |
| Art. 42, § único, CDC | III.13 | repetição em dobro |
| Arts. 396-400, CPC | III.1, pedidos | exibição de documentos |
| Art. 300, CPC | IV | tutela de urgência |
| Arts. 539 e ss., CPC | V | consignação em pagamento |
| Art. 292, II e VI, CPC | VII | valor da causa |

## Blocos por caminho

| Caminho | Blocos ligados além dos fixos |
|---|---|
| **A** — revisional + repetição, sem tutela | teses conforme o contrato |
| **B** — revisional + tutela | `tutela`, `tese_mora` |
| **C** — revisional + consignação | `tutela`, `tese_mora`, `consignacao` |
| **D** — repetição pura (quitado) | nenhum bloco de tutela, consignação ou saldo devedor |

Fixos em toda peça: `enderecamento`, `fatos`, `relacao_consumo`, `repeticao`,
`pedidos`, `valor_causa`, `fecho`.
