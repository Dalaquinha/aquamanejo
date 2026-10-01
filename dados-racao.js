// TABELAS TÉCNICAS DE ARRAÇOAMENTO — separadas das fórmulas (app.js).
// TILÁPIA: Tabela 10 do livro SILVA, B.C.; MASSAGO, H.; MARCHIORI, N.C. (Orgs.). Monocultivo de tilápia
// em viveiros escavados em Santa Catarina. Florianópolis: Epagri, 2019. (Sistemas de Produção, 52), p. 78.
// OUTRAS ESPÉCIES (pacu, tambaqui, carpa): o livro não traz tabela => null = "DADO TÉCNICO A VALIDAR".
const A_VALIDAR = 'DADO TÉCNICO A VALIDAR';
const RACAO = {
  tiposRacao: ['Extrusada (flutuante)', 'Farelada', 'Peletizada'],   // editável
  fatorTemperatura: [],   // opcional, só para espécies sem tabela própria. Ex.: [{ate: 20, fator: 0.5}]
  tilapia: {
    fonte: 'Epagri (2019), Tabela 10, p. 78',
    // Faixas de temperatura da água (°C) — mesma ordem dos vetores ta[] e rd[]
    faixasTemp: [[16,20],[20,24],[24,26],[26,30],[30,32]],
    // peso = linha da tabela (g) | ta = taxa de alimentação (% do peso vivo/dia) | rd = refeições/dia
    // pelete = granulometria (mm) | pb = proteína bruta (%)
    linhas: [
      { peso:1,   ta:[3.0,9.0,12.0,15.0,12.0], rd:[2,3,4,6,4], pelete:'Pó',      pb:'40 a 50' },
      { peso:10,  ta:[2.0,5.0,7.0,10.0,7.0],   rd:[2,3,4,6,4], pelete:'1,5',     pb:'36 a 40' },
      { peso:30,  ta:[1.2,3.6,4.8,6.0,4.8],    rd:[2,3,4,4,4], pelete:'2,0',     pb:'36 a 40' },
      { peso:50,  ta:[1.0,3.0,4.0,5.0,4.0],    rd:[2,3,4,4,4], pelete:'3,0',     pb:'36 a 40' },
      { peso:100, ta:[0.7,2.1,2.8,3.5,2.8],    rd:[1,2,3,4,3], pelete:'4,0',     pb:'32' },
      { peso:150, ta:[0.6,1.8,2.4,3.0,2.4],    rd:[1,2,3,3,3], pelete:'4,0',     pb:'32' },
      { peso:200, ta:[0.6,1.7,2.2,2.8,2.2],    rd:[1,2,3,3,3], pelete:'4,0',     pb:'32' },
      { peso:250, ta:[0.5,1.5,2.0,2.5,2.0],    rd:[1,2,2,3,2], pelete:'6,0',     pb:'32' },
      { peso:300, ta:[0.4,1.3,1.8,2.2,1.8],    rd:[1,2,2,2,2], pelete:'6,0',     pb:'32' },
      { peso:400, ta:[0.4,1.2,1.6,2.0,1.6],    rd:[1,2,2,2,2], pelete:'6,0',     pb:'32 a 28' },
      { peso:500, ta:[0.4,1.1,1.4,1.8,1.4],    rd:[1,2,2,2,2], pelete:'6,0 a 8,0', pb:'32 a 28' },
      { peso:600, ta:[0.3,0.9,1.2,1.5,1.2],    rd:[1,2,2,2,2], pelete:'6,0 a 8,0', pb:'32 a 28' },
      { peso:800, ta:[0.2,0.6,0.8,1.0,0.8],    rd:[1,2,2,2,2], pelete:'6,0 a 8,0', pb:'32 a 28' }  // ">800 g" no livro
    ]
  },
  faixas: {   // sem tabela validada
    pacu:     [ {fase:'Todas', pesoMin:0, pesoMax:1e9, taxa:null, proteina:null, pelete:null} ],
    tambaqui: [ {fase:'Todas', pesoMin:0, pesoMax:1e9, taxa:null, proteina:null, pelete:null} ],
    carpa:    [ {fase:'Todas', pesoMin:0, pesoMax:1e9, taxa:null, proteina:null, pelete:null} ]
  }
};
