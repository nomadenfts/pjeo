// Teste de integração com DOM REAL (jsdom) — troca de abas e navegação
// Executa: node tests/dom.test.cjs   (requer: npm install)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'calculadora-mobile.html'), 'utf8');

// URL http para habilitar caminhos do SW sem quebrar
const dom = new JSDOM(html, {
  url: 'http://localhost:8000/calculadora-mobile.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = () => null;
    window.navigator.vibrate = () => true;
  }
});
const { window } = dom;
const { document } = window;

// jsPDF não é baixado no teste — mock mínimo
window.jspdf = { jsPDF: function () { return { setFillColor(){},rect(){},setTextColor(){},setFontSize(){},setFont(){},text(){},setDrawColor(){},setLineWidth(){},line(){},roundedRect(){},addImage(){},save(){} }; } };

let passed = 0, failed = 0;
const ok = n => { passed++; console.log('  ✓ ' + n); };
const bad = (n, e) => { failed++; console.log('  ✗ ' + n + ' — ' + e); };
const t = (name, fn) => { try { fn(); ok(name); } catch (e) { bad(name, e.message); } };

function fireInit() {
  document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
}

setTimeout(() => {
  console.log('Navegação entre abas (o bug do usuário)');
  fireInit();

  const pageVisible = id => {
    const el = document.getElementById(id);
    const active = el.classList.contains('active');
    const display = window.getComputedStyle(el).display;
    return { active, visible: display !== 'none' };
  };

  // estado inicial: cotação ativa
  t('início: só Cotação visível', () => {
    if (!pageVisible('page-user').visible) throw new Error('cotação deveria estar visível');
    for (const p of ['page-hist', 'page-vend', 'page-admin'])
      if (pageVisible(p).visible) throw new Error(p + ' visível no início');
  });

  // vAI para histórico
  window.goPage('hist');
  t('Histórico: cotação some', () => {
    if (pageVisible('page-user').visible) throw new Error('conteúdo da cotação aparecendo no Histórico');
    if (!pageVisible('page-hist').visible) throw new Error('histórico não visível');
  });
  t('Histórico: botão CALCULAR some', () => {
    const cw = document.getElementById('calc-wrap');
    if (window.getComputedStyle(cw).display !== 'none') throw new Error('calc-wrap ainda visível');
  });
  t('Histórico: busca e resumo presentes', () => {
    if (!document.getElementById('hist-busca')) throw new Error('sem #hist-busca');
    if (!document.getElementById('hist-resumo')) throw new Error('sem #hist-resumo');
  });

  // vendedores
  window.goPage('vend');
  t('Vendedores: cotação e histórico somem', () => {
    if (pageVisible('page-user').visible) throw new Error('cotação aparecendo em Vendedores');
    if (pageVisible('page-hist').visible) throw new Error('histórico aparecendo em Vendedores');
    if (!pageVisible('page-vend').visible) throw new Error('vendedores não visível');
  });

  // admin via PIN
  window.goPage('admin');
  t('Admin: pede PIN', () => {
    if (!document.getElementById('pin-overlay').classList.contains('open')) throw new Error('overlay PIN não abriu');
    if (pageVisible('page-admin').visible) throw new Error('admin visível sem PIN');
  });
  document.getElementById('pin-input').value = '1234';
  window.validarPin();
  setTimeout(() => {
    t('Admin: PIN 1234 desbloqueia', () => {
      if (!pageVisible('page-admin').visible) throw new Error('admin não visível após PIN');
      if (document.getElementById('pin-overlay').classList.contains('open')) throw new Error('overlay ainda aberto');
    });

    // fluxo de cotação completo no DOM real
    window.goPage('user');
    document.getElementById('quantidade').value = '340';
    window.calcular();
    setTimeout(() => {
      t('Cálculo: sheet abre com resumo', () => {
        if (!document.getElementById('sheet-overlay').classList.contains('open')) throw new Error('sheet não abriu');
        const body = document.getElementById('sheet-body').innerHTML;
        if (!body.includes('Preço de Venda Total')) throw new Error('sem herói de preço');
        if (!body.includes('Comparar Materiais')) throw new Error('sem comparador');
      });
      t('Preview da etiqueta renderizou SVG', () => {
        const pv = document.getElementById('label-preview').innerHTML;
        if (!pv.includes('<svg')) throw new Error('sem SVG');
      });
      window.fecharSheet();
      window.goPage('hist');
      t('Histórico: cotação calculada aparece na lista', () => {
        const lista = document.getElementById('lista-historico').innerHTML;
        if (!lista.includes('130×30mm')) throw new Error('item não listado');
      });
      t('Resumo do período com total', () => {
        const r = document.getElementById('hist-resumo').innerHTML;
        if (!r.includes('TOTAL GERAL')) throw new Error('sem total');
      });

      // estrutura: nenhuma página dentro de outra
      t('Estrutura: páginas são irmãs sob <main>', () => {
        const main = document.querySelector('main');
        const paginas = [...main.children].filter(c => c.classList && c.classList.contains('page'));
        if (paginas.length !== 4) throw new Error('esperadas 4 páginas irmãs, tem ' + paginas.length);
      });

      console.log(failed ? `\n❌ ${failed} falha(s), ${passed} passaram` : `\n✅ TODOS OS ${passed} TESTES DOM PASSARAM`);
      process.exit(failed ? 1 : 0);
    }, 50);
  }, 50);
}, 50);
