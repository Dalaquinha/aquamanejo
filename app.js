/* AquaManejo — lógica (fórmulas) separada dos dados técnicos (pasta data/).
   Sem dependências. Registros ficam só no aparelho (localStorage). */
'use strict';
const $ = s => document.querySelector(s);
const num = id => { const v = parseFloat(String(($('#'+id)||{}).value).replace(',', '.')); return isNaN(v) ? null : v; };
const fmt = (n, d = 2) => n == null || !isFinite(n) ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: d });
// Peso: abaixo de 1.000 g mostra em gramas; a partir de 1.000 g mostra em kg (ex.: 1.900 g -> 1,9 kg)
const fmtG = g => g == null || !isFinite(g) ? '—' : Math.abs(g) >= 1000 ? fmt(g / 1000, 2) + ' kg' : fmt(g, g % 1 ? 1 : 0) + ' g';
const fmtKg = kg => fmtG(kg * 1000);
const VAL = '<span class="validar">DADO TÉCNICO A VALIDAR</span>';
const store = { get:(k,d)=>{try{return JSON.parse(localStorage.getItem('aqm.'+k))??d}catch(e){return d}}, set:(k,v)=>localStorage.setItem('aqm.'+k,JSON.stringify(v)) };
const field = (id, label, o = {}) => `<label for="${id}">${label}</label><input id="${id}" type="${o.type||'number'}" inputmode="${o.type?'text':'decimal'}" step="any" ${o.v!=null?`value="${o.v}"`:''} ${o.ph?`placeholder="${o.ph}"`:''}>`;
const res = (l, v) => `<div class="res"><span>${l}</span><b>${v}</b></div>`;
const AVISO = '<div class="aviso">Resultados são <b>estimativas de manejo</b>. Confronte com orientação técnica e com as condições reais do cultivo.</div>';

/* ---------- FÓRMULAS (puras, sem dados técnicos embutidos) ---------- */
const F = {
  biomassaKg: (qtd, pesoG) => qtd * pesoG / 1000,
  racaoDiariaKg: (biomKg, taxaPct) => biomKg * taxaPct / 100,
  fase: (esp, pesoG) => (RACAO.faixas[esp] || []).find(f => pesoG >= f.pesoMin && pesoG < f.pesoMax),
  fatorTemp: t => { const l = RACAO.fatorTemperatura; if (!l.length || t == null) return 1; const r = l.find(x => t <= x.ate); return r ? r.fator : 1; },
  // Tabela 10 (tilápia): linha = maior peso da tabela <= peso informado; faixa de temperatura = índice (ou -1 se fora de 16-32 °C)
  linhaTilapia: p => { let r = RACAO.tilapia.linhas[0]; for (const x of RACAO.tilapia.linhas) if (p >= x.peso) r = x; return r; },
  bandaTemp: t => RACAO.tilapia.faixasTemp.findIndex(([a, b], i, arr) => t >= a && (t < b || (i === arr.length - 1 && t <= b))),
  // NH3 estimada (a 28 °C) a partir da amônia total e do pH, por interpolação da Tabela 5
  nh3: (tot, ph) => { const T = AMONIA_FRACAO_28C; if (ph <= T[0][0]) return tot * T[0][1];
    for (let i = 1; i < T.length; i++) if (ph <= T[i][0]) { const [x0, y0] = T[i-1], [x1, y1] = T[i]; return tot * (y0 + (y1 - y0) * (ph - x0) / (x1 - x0)); }
    return tot * T[T.length-1][1]; },
  situacao: (v, p) => {
    const dentro = (r) => (r[0] == null || v >= r[0]) && (r[1] == null || v <= r[1]);
    const def = r => r[0] != null || r[1] != null;
    if (!def(p.ok) && !def(p.atencao)) return 'nd';
    if (def(p.ok) && dentro(p.ok)) return 'ok';
    if (def(p.atencao) && dentro(p.atencao)) return 'warn';
    return 'bad';
  }
};

/* ---------- MÓDULOS ---------- */
const MODS = [
  { id:'racao', ic:'🐟', nome:'Ração' }, { id:'agua', ic:'💧', nome:'Água' }, { id:'doencas', ic:'🦠', nome:'Doenças' },
  { id:'biomassa', ic:'📊', nome:'Biomassa' }, { id:'custos', ic:'💰', nome:'Custos' },
  { id:'crescimento', ic:'📈', nome:'Crescimento' }, { id:'biblioteca', ic:'📚', nome:'Biblioteca' }
];
const VIEWS = {};
// Cada tela registra o que deve rodar depois de desenhada; o route() executa logo após inserir o HTML.
let PENDING = null; const later = fn => { PENDING = fn; };

VIEWS.home = () => `<h1>AquaManejo</h1><p class="sub">Ferramentas para Piscicultura</p>
  <div class="grid">${MODS.map((m,i)=>`<a class="tile${i==6?' wide':''}" href="#${m.id}"><span>${m.ic}</span>${m.nome.toUpperCase()}</a>`).join('')}</div>
  <div class="aviso">Gratuito, sem cadastro e sem anúncios. Seus registros ficam só neste aparelho. Funciona sem internet.</div>`;

VIEWS.racao = () => { later(() => {
  $('#calc').onclick = () => {
    const e = $('#esp').value, q = num('qtd'), p = num('peso'), t = num('temp'), n = num('tratos'), man = num('taxa');
    const out = x => $('#out').innerHTML = x;
    if (!q || !p) return out('<div class="aviso">Informe a quantidade de peixes e o peso médio.</div>');
    const bio = F.biomassaKg(q, p); let h = res('Biomassa total', fmtKg(bio));
    let taxa = man, rd = n, pb = null, pel = null, fonte = '', origem = man != null ? ' (informada)' : '';
    if (e === 'tilapia') {
      if (t == null) return out('<div class="aviso">Para tilápia, informe a temperatura da água: a tabela depende dela.</div>');
      const L = F.linhaTilapia(p), b = F.bandaTemp(t);
      h += res('Linha da tabela (peso)', (L.peso >= 800 ? '800 g ou mais' : L.peso + ' g') + (p < 1 ? ' (peso abaixo de 1 g)' : ''));
      if (b < 0) return out(`<div class="card">${h}</div><div class="aviso"><b>Não alimentar:</b> a tabela indica não alimentar a tilápia com a água abaixo de 16 °C ou acima de 32 °C.</div>`);
      if (taxa == null) { taxa = L.ta[b]; origem = ' (Tabela 10)'; }
      if (rd == null) rd = L.rd[b];
      pb = L.pb + ' % PB'; pel = L.pelete === 'Pó' ? 'Pó' : L.pelete + ' mm'; fonte = RACAO.tilapia.fonte;
    } else {
      const f = F.fase(e, p); if (taxa == null && f) taxa = f.taxa; if (f) { pb = f.proteina != null ? f.proteina + ' % PB' : null; pel = f.pelete != null ? f.pelete + ' mm' : null; }
    }
    const fT = e === 'tilapia' ? 1 : F.fatorTemp(t);
    h += res('Taxa de arraçoamento', taxa == null ? VAL : fmt(taxa) + ' % do peso vivo/dia' + origem);
    if (taxa != null) {
      const d = F.racaoDiariaKg(bio, taxa) * fT;
      h += res('Ração por dia', fmtKg(d)) + res('Ração por trato' + (rd ? ' (' + rd + ' tratos/dia)' : ''), rd ? fmtG(d / rd * 1000) : 'informe os tratos') +
           res('Estimativa semanal', fmtKg(d * 7)) + res('Estimativa mensal (30 dias)', fmtKg(d * 30));
    } else h += res('Ração diária / por trato / semana / mês', 'informe a taxa acima');
    h += res('Proteína indicada', pb || VAL) + res('Tamanho do pélete', pel || VAL);
    out(`<div class="card">${h}</div>` + (fonte ? `<div class="aviso">Fonte: ${fonte}. A tabela é referência: ajuste observando sobras de ração e o comportamento dos peixes. Confira a biomassa com biometria (mín. 40 a 50 peixes).</div>` : '') + AVISO);
  };
}); return `<h1>🐟 Ração</h1>
  <div class="aviso"><b>Tilápia:</b> usa a Tabela 10 da Epagri (2019). <b>Pacu, tambaqui e carpa:</b> sem tabela cadastrada (<span class="validar">DADO TÉCNICO A VALIDAR</span>) — digite a taxa do seu técnico ou preencha <code>data/racao.js</code>.</div>
  <label for="esp">Espécie</label><select id="esp">${ESPECIES.map(e=>`<option value="${e.id}">${e.nome}</option>`).join('')}</select>
  ${field('qtd','Quantidade de peixes')}${field('peso','Peso médio individual (g)')}${field('temp','Temperatura da água (°C)')}${field('tratos','Número de tratos por dia',{ph:'tilápia: usa a tabela'})}
  <label for="tipo">Tipo de ração</label><select id="tipo">${RACAO.tiposRacao.map(t=>`<option>${t}</option>`).join('')}</select>
  ${field('taxa','Taxa de arraçoamento (% do peso vivo/dia) — opcional',{ph:'vazio = usa a tabela'})}
  <button id="calc">Calcular</button><div id="out"></div>`; };

VIEWS.biomassa = () => { later(() => {
  $('#b1').onclick = () => { const q=num('bq'),p=num('bp'); $('#o1').innerHTML = q&&p ? `<div class="card">${res('Biomassa total',fmtKg(F.biomassaKg(q,p)))}</div>` : ''; };
  $('#b2').onclick = () => { const n=num('sn'),t=num('st'); const pm = n&&t ? t*1000/n : null;
    $('#o2').innerHTML = pm ? `<div class="card">${res('Peso médio da amostra',fmtG(pm))}${num('sq')?res('Biomassa estimada',fmtKg(F.biomassaKg(num('sq'),pm))):''}</div>` : ''; };
  $('#b3').onclick = () => { const q=num('dq'),p=num('dp'); let v=num('dv'); const c=num('dc'),l=num('dl'),pr=num('dpr'); if(!v&&c&&l&&pr) v=c*l*pr;
    const bio = q&&p ? F.biomassaKg(q,p) : null; let h='';
    if (v) { h += res('Volume de água',fmt(v)+' m³'); if(q) h+=res('Densidade',fmt(q/v)+' peixes/m³'); if(bio) h+=res('Biomassa por volume',fmt(bio/v)+' kg/m³'); }
    $('#o3').innerHTML = h ? `<div class="card">${h}</div>` : '<div class="aviso">Informe o volume (ou comprimento, largura e profundidade).</div>'; };
}); return `<h1>📊 Biomassa</h1>
  <h2>Biomassa total</h2>${field('bq','Quantidade de peixes')}${field('bp','Peso médio (g)')}<button id="b1">Calcular biomassa</button><div id="o1"></div>
  <h2>Peso médio por amostra</h2>${field('sn','Peixes na amostra')}${field('st','Peso total da amostra (kg)')}${field('sq','Total de peixes no tanque (opcional)')}<button id="b2" class="sec">Calcular peso médio</button><div id="o2"></div>
  <h2>Densidade e biomassa por volume</h2>${field('dq','Quantidade de peixes')}${field('dp','Peso médio (g)')}${field('dv','Volume de água (m³)')}
  <div class="row2">${field('dc','Comprimento (m)')}${field('dl','Largura (m)')}</div>${field('dpr','Profundidade média (m)')}<button id="b3" class="sec">Calcular densidade</button><div id="o3"></div>${AVISO}`; };

VIEWS.agua = () => { later(() => {
  const faixas = () => store.get('agua', {});
  const get = p => Object.assign({}, p, faixas()[p.id] || {});
  $('#ag').onclick = () => { let h = '';
    if (num('a_nh3') == null && num('a_nh4t') != null && num('a_ph') != null) { $('#a_nh3').value = F.nh3(num('a_nh4t'), num('a_ph')).toFixed(3); h += '<div class="aviso">NH₃ estimada pela amônia total e pelo pH, a 28 °C (Tabela 5). Em água mais quente a toxicidade é maior.</div>'; }
    AGUA.forEach(p0 => { const p = get(p0), v = num('a_'+p.id); if (v == null) return; const s = F.situacao(v, p);
      const txt = { ok:'Adequada', warn:'Atenção', bad:'Fora da faixa', nd:'Faixa não definida' }[s];
      const r = x => x[0]==null&&x[1]==null ? VAL : `${x[0]??'…'} a ${x[1]??'…'}`;
      h += `<div class="card"><b>${p.nome}</b>: ${fmt(v)} ${p.un} <span class="st ${s}">${txt}</span>
        ${res('Faixa adequada',r(p.ok))}${res('Faixa de atenção',r(p.atencao))}<div class="sub">${p.obs || 'Observação técnica: ' + 'DADO TÉCNICO A VALIDAR'}</div></div>`; });
    $('#ao').innerHTML = (h || '<div class="aviso">Informe ao menos um parâmetro.</div>') + `<div class="aviso">Faixas para <b>tilápia</b> em viveiro escavado (${AGUA_FONTE}). Consulta de referência: não é diagnóstico de doença. Para outras espécies, edite as faixas.</div>`; };
  $('#ed').onclick = () => { $('#ef').innerHTML = AGUA.map(p0 => { const p = get(p0);
    return `<div class="card"><b>${p.nome}</b> (${p.un})<div class="row2">${field('o0'+p.id,'Adequada: mín.',{v:p.ok[0]})}${field('o1'+p.id,'Adequada: máx.',{v:p.ok[1]})}${field('t0'+p.id,'Atenção: mín.',{v:p.atencao[0]})}${field('t1'+p.id,'Atenção: máx.',{v:p.atencao[1]})}</div></div>`; }).join('') + '<button id="sv">Salvar faixas neste aparelho</button><button id="rs" class="sec">Restaurar padrão</button>';
    $('#sv').onclick = () => { const o = {}; AGUA.forEach(p => o[p.id] = { ok:[num('o0'+p.id),num('o1'+p.id)], atencao:[num('t0'+p.id),num('t1'+p.id)] }); store.set('agua', o); alert('Faixas salvas.'); };
    $('#rs').onclick = () => { store.set('agua', {}); $('#ef').innerHTML = ''; }; };
}); return `<h1>💧 Água</h1>${AGUA.map(p=>field('a_'+p.id, `${p.nome} ${p.un?'('+p.un+')':''}`)).join('')}${field('a_nh4t','Amônia total do kit (mg N/L) — estima a NH₃ pelo pH')}<button id="ag">Consultar</button><div id="ao"></div>
  <h2>Faixas de referência</h2><p class="sub">Padrão: tilápia (Epagri, 2019). Edite para outra espécie ou fonte técnica.</p><button id="ed" class="sec">Editar faixas</button><div id="ef"></div>`; };

VIEWS.doencas = () => { later(() => {
  const q = $('#dq2'), lista = $('#dl2');
  const foto = d => d.foto ? `<img src="${d.foto}" alt="Foto: ${d.nome}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'semfoto',innerHTML:'<span>🐟</span>Foto a incluir'}))">`
                           : '<div class="semfoto"><span>🐟</span>Foto a incluir</div>';
  const draw = () => { const t = q.value.toLowerCase();
    lista.innerHTML = DOENCAS_CATEGORIAS.map(c => {
      const l = DOENCAS.map((d, i) => [d, i]).filter(([d]) => d.cat === c && JSON.stringify(d).toLowerCase().includes(t)); if (!l.length) return '';
      return `<h2>${c}</h2><div class="dgrid">${l.map(([d, i]) => `<button class="dcard" data-i="${i}">${foto(d)}<b>${d.nome}</b></button>`).join('')}</div>`; }).join('') || '<p>Nada encontrado.</p>';
    lista.querySelectorAll('.dcard').forEach(b => b.onclick = () => ficha(+b.dataset.i)); };
  const ficha = i => { const d = DOENCAS[i];
    const campos = [['Espécies afetadas', d.especies], ['Sinais observáveis', d.sinais], ['Possíveis causas e fatores associados', d.fatores], ['Condições que favorecem', d.favorecem], ['Medidas de prevenção', d.prevencao], ['Manejo recomendado', d.manejo]];
    const txt = v => [].concat(v).map(x => `<li>${String(x).replace('DADO TÉCNICO A VALIDAR', VAL)}</li>`).join('');
    $('#view').innerHTML = `<button class="sec small" id="voltar">← Voltar às doenças</button><h1 style="margin-top:12px">${d.nome}</h1><div class="fotogrande">${foto(d)}</div>${d.credito ? `<p class="sub">Foto: ${d.credito}</p>` : ''}
      <div class="aviso"><b>Material de consulta. Não é diagnóstico veterinário.</b> Sinais isolados não confirmam a doença.</div>
      ${campos.map(([k, v]) => `<div class="card"><h2 style="margin-top:0">${k}</h2><ul>${txt(v)}</ul></div>`).join('')}
      <div class="card"><h2 style="margin-top:0">Quando procurar assistência profissional</h2><p>${d.profissional}</p></div>
      <p class="sub">Fonte: ${d.fonte || '—'}</p>`;
    window.scrollTo(0, 0); $('#voltar').onclick = () => { route(); }; };
  q.oninput = draw; draw(); });
  return `<h1>🦠 Doenças e sinais</h1><div class="aviso"><b>Material de consulta. Não é diagnóstico veterinário.</b> Toque na foto que mais se parece com o problema para ver os detalhes.</div>${field('dq2','Buscar',{type:'search',ph:'nome, sinal, espécie…'})}<div id="dl2"></div>`; };

VIEWS.custos = () => { later(() => $('#cc').onclick = () => { const pr=num('cp'),pk=num('ck'),d=num('cd'),g=num('cg'); if(!pr||!pk||!d) return;
  const kg = pr/pk, dia = d*kg, mes = dia*30;
  $('#co').innerHTML = `<div class="card">${res('Preço por kg de ração','R$ '+fmt(kg))}${res('Consumo mensal (30 dias)',fmtKg(d*30))}${res('Custo diário','R$ '+fmt(dia))}${res('Custo mensal','R$ '+fmt(mes))}${g?res('Custo por kg de peixe produzido','R$ '+fmt(mes/g)):''}</div>`; });
  return `<h1>💰 Custo de ração</h1>${field('cp','Preço do saco (R$)')}${field('ck','Peso do saco (kg)',{v:25})}${field('cd','Consumo diário (kg)')}${field('cg','Peixe produzido no mês (kg) — opcional')}<button id="cc">Calcular custos</button><div id="co"></div>`; };

VIEWS.crescimento = () => { later(() => { const draw = () => { const l = store.get('cresc', []).sort((a,b)=>a.data.localeCompare(b.data));
  $('#cl').innerHTML = l.length ? `<div class="scroll"><table><tr><th>Data</th><th>Peso médio</th><th>Peixes</th><th>Biomassa</th><th>Ganho</th><th>GMD</th><th>CA</th><th></th></tr>${l.map((r,i)=>{ const a=l[i-1]; let gan=null,gmd=null,ca=null;
    if(a){ gan=r.peso-a.peso; const dias=(new Date(r.data)-new Date(a.data))/864e5; gmd=dias>0?gan/dias:null; const gb=r.bio-a.bio; if(r.racao&&gb>0) ca=r.racao/gb; }
    return `<tr><td>${r.data.split('-').reverse().join('/')}</td><td>${fmtG(r.peso)}</td><td>${r.qtd}</td><td>${fmtKg(r.bio)}</td><td>${gan==null?'—':fmtG(gan)}</td><td>${gmd==null?'—':fmt(gmd,1)+' g/dia'}</td><td>${fmt(ca)}</td><td><button class="small danger" data-i="${r.id}">✕</button></td></tr>`;}).join('')}</table></div><p class="sub">CA = ração consumida ÷ ganho de biomassa desde o registro anterior.</p>` : '<p>Nenhum registro ainda. Adicione o primeiro acima.</p>';
  document.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { store.set('cresc', store.get('cresc',[]).filter(r => r.id != b.dataset.i)); draw(); }); };
  $('#gs').onclick = () => { const d=$('#gd').value,p=num('gp'),q=num('gq'); if(!d||!p||!q) return alert('Informe data, peso médio e quantidade.');
    const l = store.get('cresc',[]); l.push({ id:Date.now(), data:d, peso:p, qtd:q, bio:F.biomassaKg(q,p), racao:num('gr') }); store.set('cresc', l); draw(); };
  $('#gd').valueAsDate = new Date(); draw(); });
  return `<h1>📈 Crescimento</h1><label for="gd">Data</label><input id="gd" type="date">${field('gp','Peso médio (g)')}${field('gq','Quantidade de peixes')}${field('gr','Ração consumida desde o registro anterior (kg) — opcional')}<button id="gs">Salvar registro</button><h2>Registros (salvos só neste aparelho)</h2><div id="cl"></div>`; };

VIEWS.biblioteca = () => { later(() => { const q = $('#bq2'); const draw = () => { const t = q.value.toLowerCase(); const l = BIBLIOTECA.filter(a => JSON.stringify(a).toLowerCase().includes(t));
  $('#bl').innerHTML = l.map(a => `<details><summary>${a.titulo} <small>(${a.tema})</small></summary><p>${a.texto.replace('DADO TÉCNICO A VALIDAR',VAL)}</p><p class="sub">Fonte: ${a.fonte}</p></details>`).join('') || '<p>Nada encontrado.</p>'; }; q.oninput = draw; draw(); });
  return `<h1>📚 Biblioteca</h1>${field('bq2','Buscar',{type:'search',ph:'ex.: aclimatação'})}<div id="bl"></div>`; };

/* ---------- NAVEGAÇÃO, OFFLINE, SERVICE WORKER ---------- */
function route() { const id = (location.hash || '#home').slice(1); const v = VIEWS[id] || VIEWS.home;
  PENDING = null; const html = v(); $('#view').innerHTML = html; if (PENDING) { const p = PENDING; PENDING = null; p(); } window.scrollTo(0, 0);
  $('#tabs').innerHTML = MODS.map(m => `<a href="#${m.id}" class="${m.id===id?'on':''}"><span>${m.ic}</span>${m.nome}</a>`).join(''); }
addEventListener('hashchange', route);
const net = () => $('#offline').hidden = navigator.onLine; addEventListener('online', net); addEventListener('offline', net);
net(); route();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
