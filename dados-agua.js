// Parâmetros de qualidade da água — valores para TILÁPIA em viveiro escavado.
// Fonte: Epagri (2019), Monocultivo de tilápia em viveiros escavados em SC, cap. 7 (pp. 57-63) e Tabela 6.
// ok = faixa adequada | atencao = faixa mais ampla (atenção) | fora das duas = fora da faixa. null = sem limite.
// Para outras espécies, edite as faixas no app. Faixas "de atenção" marcadas "(critério do app)" foram derivadas
// dos limites de manejo citados no livro — confira antes de usar como regra.
const AGUA_FONTE = 'Epagri (2019), cap. 7 — tilápia em viveiro escavado';
const AGUA = [
  { id:'temp',  nome:'Temperatura', un:'°C', ok:[26,30], atencao:[22,32],
    obs:'Adequada para tilápia: 26 a 30 °C. Evitar manejo (biometria, povoamento, transferência) abaixo de 22 °C e acima de 30 °C. Não alimentar abaixo de 16 °C nem acima de 32 °C. Faixa de atenção (22 a 32 °C): critério do app.' },
  { id:'ph',    nome:'pH', un:'', ok:[6.5,8.5], atencao:[6,10],
    obs:'Ideal para tilápia: 6,5 a 8,5. É comum o pH variar de 6 a 10 em viveiros. Variação diária maior que 2 unidades não é adequada. Abaixo de 6 ou acima de 10: ver medidas da Tabela 7 do livro.' },
  { id:'od',    nome:'Oxigênio dissolvido (manhã)', un:'mg/L', ok:[3,null], atencao:[2,null],
    obs:'Pela manhã manter sempre acima de 3 mg/L; nos horários de alimentação, acima de 4 mg/L. Valores abaixo de 2 mg/L pela manhã são comuns, mas não adequados (pior ganho de peso e conversão). Faixa de atenção (2 a 3): critério do app.' },
  { id:'nh3',   nome:'Amônia não ionizada (NH₃)', un:'mg N-NH₃/L', ok:[null,0.1], atencao:[null,1],
    obs:'Adequado: abaixo de 0,1 mg N-NH₃/L. Acima disso a conversão piora e se indica reduzir a alimentação temporariamente. Acima de 1 mg/L pode causar letargia e morte. O kit mede amônia TOTAL: use o campo abaixo para estimar a NH₃ pelo pH.' },
  { id:'no2',   nome:'Nitrito', un:'mg N-NO₂/L', ok:[null,0.3], atencao:[null,2.5],
    obs:'Recomendado para tilápia: abaixo de ~0,3 mg N-NO₂/L (≈1,0 mg NO₂/L). Mortalidades por volta de 2,5 mg N-NO₂/L (≈8 mg NO₂/L). Kits geralmente dão N-NO₂; para NO₂ multiplique por 3,28. Limite de atenção: leitura da Figura 20 do livro.' },
  { id:'alc',   nome:'Alcalinidade', un:'mg/L CaCO₃', ok:[30,null], atencao:[null,null],
    obs:'Manter sempre acima de 30 mg/L de CaCO₃; no inverno, acima de 40 mg/L. Se baixa, corrigir com calcário (doses na Tabela 7 do livro).' },
  { id:'transp',nome:'Transparência (disco de Secchi)', un:'cm', ok:[25,40], atencao:[null,null],
    obs:'Adequada: 25 a 40 cm, com água esverdeada e homogênea. Acima de 40 cm favorece algas filamentosas e plantas; abaixo de 25 cm indica excesso de fitoplâncton (risco de oxigênio baixo pela manhã).' }
];
// Fração de amônia não ionizada (NH₃/NH₃+NH₄) a 28 °C, por pH — obtida da Tabela 5 do livro (coluna 1,0 mg/L), p. 60.
// Quanto maior a temperatura, maior a toxicidade (4 a 8 % por °C, entre pH 6 e 9).
const AMONIA_FRACAO_28C = [[6.0,0.001],[6.5,0.002],[7.0,0.007],[7.5,0.021],[8.0,0.065],[8.5,0.18],[9.0,0.409],[9.5,0.687],[10.0,0.874]];
