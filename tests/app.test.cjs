// Teste de regressão — Calculadora de Rótulos V3
// Executa: node tests/app.test.cjs
// Simula o DOM e valida 52 comportamentos (helpers, PIN, cálculo, filtros, XSS, backup...).
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const APP = path.join(__dirname, '..', 'calculadora-mobile.html');
(async () => {
// Harness de testes — Calculadora de Rótulos V3 (aperfeiçoada)
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(APP, 'utf8');
let script = html.split('<script>')[1].split('</' + 'script>')[0];
script = script.replace("'use strict';", '');

// ---------- DOM stub ----------
function makeEl(id) {
  return {
    id, value: '', checked: false, innerHTML: '', textContent: '', className: '',
    style: {}, dataset: {}, disabled: false, src: '', files: [],
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (f) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    get outerHTML() { const cls = this.className ? ' class="' + this.className + '"' : ''; return '<div' + cls + '>' + this.innerHTML + '</div>'; },
    appendChild(c) { this.innerHTML += (c && c.outerHTML) || ''; },
    addEventListener() {}, setAttribute() {}, removeAttribute() {},
    focus() {}, click() {},
    get offsetWidth() { return 100; },
    scrollIntoView() {}
  };
}
const els = {};
const radios = { Rascunho: makeEl('r1'), Padrao: makeEl('r2'), Alta: makeEl('r3'), Maxima: makeEl('r4') };
radios.Padrao.checked = true;
let domHandler = null;

global.document = {
  getElementById(id) { return els[id] || (els[id] = makeEl(id)); },
  createElement() { return makeEl('dyn'); },
  querySelector(sel) {
    if (sel.includes(':checked') && sel.includes('modo')) {
      return Object.values(radios).find(r => r.checked) || null;
    }
    if (sel.includes('modo') && sel.includes('=')) {
      const m = sel.match(/value="([^"]+)"/);
      return m ? radios[m[1]] : null;
    }
    return null;
  },
  addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') domHandler = fn; },
  removeEventListener() {},
  body: Object.assign(makeEl('body'), { appendChild() {}, removeChild() {} })
};
global.window = { addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') domHandler = fn; } };
global.navigator = {};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.location = { protocol: 'file:' };

vm.runInThisContext(script);
// pré-cria elementos usados nos testes
['pin-input','pin-overlay','pin-status','largura','altura','gap','quantidade','vendedor','empresa','frete','material','cor-yellow','cor-magenta','cor-cyan','cor-black','cor-white','cor-branco-cov','white-cov-wrap','sheet-body','sheet-overlay','lista-materiais','lista-vendedores','vendedor-select','hist-filtro-vend','hist-busca','hist-data-ini','hist-data-fim','hist-resumo','lista-historico','confirm-overlay','confirm-yes','confirm-no','label-preview','toast','sync-badge','storage-note','rend-etiquetas-m2','rend-area-unit','rend-area-util','conv-m2','conv-m2-result','conv-etiq','conv-etiq-result','logo-preview','novo-pin','calc-wrap','file-backup'].forEach(id=>document.getElementById(id));
// defaults do HTML real
els['cor-yellow'].checked = els['cor-magenta'].checked = els['cor-cyan'].checked = els['cor-black'].checked = true;

let passed = 0;
function ok(name) { passed++; console.log('  ✓ ' + name); }

// ============ 1. HELPERS ============
console.log('1) Helpers');
assert.strictEqual(esc('<img src=x onerror="p(1)">'), '&lt;img src=x onerror=&quot;p(1)&quot;&gt;'); ok('esc() neutraliza HTML');
assert.strictEqual(r2(41.374999999), 41.37); ok('r2 arredonda centavos');
assert.strictEqual(r4(0.123456), 0.1235); ok('r4 arredonda 4 casas');
assert.strictEqual(csvCell('=SOMA(A1)'), "'=SOMA(A1)"); ok('csvCell neutraliza fórmula');
assert.strictEqual(csvCell('COUCHÊ'), 'COUCHÊ'); ok('csvCell mantém texto comum');
const ids = new Set(Array.from({ length: 5000 }, () => novoId()));
assert.strictEqual(ids.size, 5000); ok('novoId: 5000 ids únicos');
assert.strictEqual(parseDataBr('20/09/2026').getDate(), 20); ok('parseDataBr dd/mm/yyyy');
assert.strictEqual(parseDataBr('20/09/2026 14:33').getMonth(), 8); ok('parseDataBr com hora');
assert.strictEqual(parseDataBr('2026-09-20').getFullYear(), 2026); ok('parseDataBr yyyy-mm-dd');
assert.strictEqual(parseDataBr('lixo'), null); ok('parseDataBr lixo → null');
assert.strictEqual(migrate({ materiais: [] }).versao, 16); ok('migrate versiona dados antigos');

// ============ 2. PIN ============
console.log('2) Segurança do PIN');
els['pin-input'].value = '9999';
validarPin();
await new Promise(r => setTimeout(r, 30));
assert.strictEqual(adminUnlocked, false); ok('PIN errado não desbloqueia');
els['pin-input'].value = '1234';
await validarPin();
await new Promise(r => setTimeout(r, 30));
assert.strictEqual(adminUnlocked, true); ok('PIN correto desbloqueia');
assert.ok(loadDB().pin.startsWith('sha256:')); ok('PIN migrado para hash SHA-256');
bloquearAdmin();
assert.strictEqual(adminUnlocked, false); ok('bloquearAdmin() trava novamente');
els['pin-input'].value = '1234';
await validarPin();
await new Promise(r => setTimeout(r, 30));
assert.strictEqual(adminUnlocked, true); ok('hash SHA-256 valida no 2º acesso');

// ============ 3. INIT + CÁLCULO ============
console.log('3) Cálculo completo');
domHandler(); // DOMContentLoaded
els['largura'].value = '130'; els['altura'].value = '30'; els['gap'].value = '3';
els['quantidade'].value = '340';
els['vendedor'].value = '5'; els['empresa'].value = '15'; els['frete'].value = '0';
els['material'].value = 'COUCHÊ';
calcular();
await new Promise(r => setTimeout(r, 10));
const R = ultimoResultado;
const areaP = ((136 / 1000) * (36 / 1000)) * 340 * 1.15;
assert.strictEqual(R.largura, 130); ok('dimensões lidas');
assert.strictEqual(R.areaUtil, 0.9); ok('área útil padrão 0,9');
assert.strictEqual(R.tempoProducao, areaP / 10); ok('tempo = área ÷ velocidade');
const cTirEsperado = r2(r2(15.511375 * areaP) + r2((areaP / 10) * 25));
assert.strictEqual(R.cTir, cTirEsperado); ok('custo tiragem (material+tinta+máquina)');
assert.strictEqual(R.pTot, r2(cTirEsperado + r2(cTirEsperado*0.15) + r2(cTirEsperado*0.05))); ok('preço = custo + 15% empresa + 5% vendedor (arredondados por parcela)');
const db1 = loadDB();
assert.strictEqual(db1.historico.length, 1); ok('cotação salva no histórico');
assert.ok(db1.historico[0].id > 1e15); ok('id único (novoId)');

// ============ 4. VALIDAÇÃO ============
console.log('4) Validações');
els['largura'].value = '-50';
calcular();
assert.strictEqual(loadDB().historico.length, 1); ok('largura negativa rejeitada');
els['largura'].value = '130'; els['vendedor'].value = '150';
calcular();
assert.strictEqual(loadDB().historico.length, 1); ok('comissão >100% rejeitada');
els['vendedor'].value = '5';
els['cor-yellow'].checked = els['cor-magenta'].checked = els['cor-cyan'].checked = els['cor-black'].checked = false;
calcular();
assert.strictEqual(loadDB().historico.length, 1); ok('zero cores rejeitado');
els['cor-yellow'].checked = els['cor-magenta'].checked = els['cor-cyan'].checked = els['cor-black'].checked = true;

// ============ 5. COMPARADOR + XSS ============
console.log('5) Comparador e XSS');
const sheet = els['sheet-body'].innerHTML;
assert.ok(sheet.includes('Comparar Materiais')); ok('comparador presente no resumo');
assert.ok(sheet.includes('METALIZADO') && sheet.includes('TRANSPARENTE')); ok('todos materiais listados');
assert.ok(sheet.includes('sel-mat')); ok('material selecionado destacado');
assert.ok(sheet.indexOf('COUCHÊ') < sheet.indexOf('METALIZADO')); ok('ordenado por preço');
const dbx = loadDB();
dbx.materiais.push({ nome: '<img src=x onerror=x()>', valor: 1, icms: 0 });
saveDB(dbx);
renderMateriais();
const lista = els['lista-materiais'].innerHTML;
assert.ok(!lista.includes('<img src=x')); ok('XSS bloqueado no render');
assert.ok(lista.includes('&lt;img')); ok('nome perigoso aparece escapado');
dbx.materiais.pop(); saveDB(dbx); renderMateriais();

// ============ 6. FILTROS DO HISTÓRICO ============
console.log('6) Filtros do histórico (bug corrigido)');
els['hist-filtro-vend'].value = ''; els['hist-busca'].value = '';
els['hist-data-ini'].value = '2020-01-01'; els['hist-data-fim'].value = '';
let h = getHistoricoFiltrado();
assert.strictEqual(h.length, 1); ok('filtro de data NÃO esvazia mais a lista');
els['hist-data-ini'].value = '2099-01-01';
assert.strictEqual(getHistoricoFiltrado().length, 0); ok('data futura filtra de verdade');
els['hist-data-ini'].value = '';
els['hist-busca'].value = 'couch';
assert.strictEqual(getHistoricoFiltrado().length, 1); ok('busca por material');
els['hist-busca'].value = '130x30';
assert.strictEqual(getHistoricoFiltrado().length, 1); ok('busca por tamanho');
els['hist-busca'].value = 'zzz';
assert.strictEqual(getHistoricoFiltrado().length, 0); ok('busca sem resultado');
els['hist-busca'].value = '';
assert.strictEqual(renderResumo(getHistoricoFiltrado()), undefined); ok('resumo renderiza');
assert.ok(els['hist-resumo'].innerHTML.includes('TOTAL GERAL')); ok('resumo com total');
assert.ok(els['hist-resumo'].innerHTML.includes('Sem vendedor')); ok('resumo agrupa vendedor');

// ============ 7. MODAL DE CONFIRMAÇÃO ============
console.log('7) Modal de confirmação');
const promessa = askConfirm('Testa modal?');
await new Promise(r => setTimeout(r, 20));
els['confirm-yes'].onclick();
assert.ok(await promessa); ok('Confirmar → true');
const promessa2 = askConfirm('Testa cancelar?');
await new Promise(r => setTimeout(r, 20));
els['confirm-no'].onclick();
assert.strictEqual(await promessa2, false); ok('Cancelar → false');
const idCot = loadDB().historico[0].id;
const p3 = excluirCotacao(idCot);
await new Promise(r => setTimeout(r, 20));
els['confirm-yes'].onclick();
await p3;
assert.strictEqual(loadDB().historico.length, 0); ok('excluirCotação com modal funciona');

// ============ 8. BACKUP / RESTAURAR ============
console.log('8) Backup preserva histórico');
const dbh = loadDB();
dbh.historico.push({ id: novoId(), data: '20/09/2026 10:00', dataBr: '20/09/2026', vendedor: '—', largura: 130, altura: 30, gap: 3, quantidade: 340, material: 'COUCHÊ', precoTotal: 41.37, precoUnit: 0.1217, pctVendedor: 5, pctEmpresa: 15, frete: 0, custoTiragem: 34.48, valEmpresa: 5.17, valVendedor: 1.72 });
saveDB(dbh);
els['cfg-perda'].value = '99';
const pr = restaurarPadroes();
await new Promise(r => setTimeout(r, 20));
els['confirm-yes'].onclick();
await pr;
assert.strictEqual(loadDB().configs.perda, 15); ok('restaurar volta configs de fábrica');
assert.strictEqual(loadDB().historico.length, 1); ok('restaurar MANTÉM o histórico');
assert.ok(loadDB().pin.startsWith('sha256:')); ok('restaurar MANTÉM o PIN');

// ============ 9. PREVIEW DA ETIQUETA ============
console.log('9) Preview da etiqueta');
calcularRendimento();
const pv = els['label-preview'].innerHTML;
assert.ok(pv.includes('<svg')); ok('preview SVG gerado');
assert.ok(pv.includes('130 × 30 mm')); ok('dimensões no preview');
assert.ok(pv.includes('gap 3')); ok('gap no preview');
els['largura'].value = '0';
calcularRendimento();
assert.strictEqual(els['label-preview'].innerHTML, ''); ok('dimensão inválida → sem preview');
els['largura'].value = '130';

// ============ 10. FIREBASE SOB DEMANDA ============
console.log('10) Cloud');
assert.strictEqual(cloudConfigured, false); ok('placeholder não ativa cloud');
assert.strictEqual(typeof global.firebase, 'undefined'); ok('firebase NÃO carregado (lazy)');

console.log('\n✅ TODOS OS ' + passed + ' TESTES PASSARAM');
process.exit(0);

})().catch(e => { console.error('\n✗ FALHA:', e.message); process.exit(1); });