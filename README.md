# pjeo — Calculadora de Rótulos V3

App mobile de **cotação digital para impressão de rótulos** — arquivo único em HTML/CSS/JS, sem build.
Autor do código original: **Daniel Souza** (v17.0).

## Como usar

- **Preview:** o servidor da porta 8000 abre `index.html`, que redireciona para `calculadora-mobile.html`.
- **Local:** abra o arquivo direto no navegador, ou sirva a pasta:
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000
  ```
- **Instalar como app (PWA):** abra no celular (HTTPS), menu → *Adicionar à tela inicial*.
  Fica com ícone próprio e **funciona offline** (jsPDF cacheado pelo service worker).

## Funcionalidades

- 🧮 **Cotação**: dimensões (largura × altura × gap), quantidade, material e modo de impressão
  (Rascunho 300×600, Produção 600×600, Alta 600×900, Máxima 1200×1200)
- 📐 **Rendimento por m²**: etiquetas por m² (com área útil configurável), conversor m² ⇄ etiquetas
  e **prévia visual da etiqueta** em SVG (proporção + gap em tempo real)
- 🎨 **Cores CMYK + branco** com cobertura (20–100%) e purga/limpeza
- 💼 **Comercial**: comissão de vendedor e empresa, frete, preço total e por unidade
- ⚖️ **Comparador de materiais**: no resumo da cotação, o preço final em todos os materiais,
  ordenado do mais barato ao mais caro (o selecionado fica destacado)
- 📊 **Resumo em bottom-sheet** com composição completa de custos (material + ICMS, tinta, máquina por tempo)
- 📜 **Histórico**: filtros por vendedor/data (corrigidos), **busca textual**, **resumo do período
  com total por vendedor**, reabrir cotação, exportar **CSV** (protegido contra injeção de fórmulas)
- 👥 **Vendedores** com comissão personalizada
- ⚙️ **Admin protegido por PIN** (padrão `1234`): materiais (R$/m² + ICMS), custos/velocidade por modo,
  hora-máquina, margem de perda, logo, backup JSON, restaurar padrões
- ☁️ **Sync Firebase opcional** — preencha `FIREBASE_CONFIG` no código (os scripts só baixam
  quando há configuração real); sem isso, tudo persiste em `localStorage` (📴 LOCAL)

## Melhorias técnicas (v17)

| Área | O que mudou |
|---|---|
| 🐛 Filtro de datas | `new Date('20-09-2026')` → Invalid Date; agora parseia `yyyy-mm-dd` e `dd/mm/yyyy` corretamente |
| 🔐 PIN | Hash SHA-256 (migração automática do texto plano), 5 tentativas → bloqueio de 30s, botão *Bloquear Admin*, auto-bloqueio após 10 min de inatividade |
| 🛡️ XSS | Nomes de materiais/vendedores/history escapados antes do `innerHTML` |
| ✅ Validação | Dimensões > 0, gap ≥ 0, comissões 0–100, frete ≥ 0 |
| 🆔 IDs | `novoId()` monotônico — sem colisão em reabrir/excluir |
| 💾 Backup | Agora inclui **histórico e PIN**; *Restaurar Padrões* pergunta em modal e **mantém histórico/PIN** |
| 💰 Arredondamento | Centavos estáveis com `r2()/r4()` (sem `41.376599999` no CSV) |
| ☁️ Firebase | Scripts só carregam sob demanda (~100KB a menos por visita) |
| ⚡ Performance | Cache em memória do banco (era `JSON.parse` a cada tecla) |
| 🖨️ PDF | `addImage` detecta PNG/JPEG real (antes usava formato inválido `'AUTO'`) |
| 🔢 Versão | Chave de dados fixa + campo `versao` + rotina `migrate()` (sem perder dados ao atualizar) |
| 📱 PWA | `manifest.json` + ícones + service worker (offline) |
| ♿ Acessibilidade | Zoom habilitado, `label for` em todos os campos, `aria-label` em botões-ícone, toasts com `aria-live` |
| 🖥️ UX | Modais de confirmação estilizados (sem `confirm()` nativo) |

## Estrutura

```
pjeo/
├── index.html               # redireciona para o app
├── calculadora-mobile.html  # o app completo (HTML + CSS + JS)
├── manifest.json            # PWA
├── sw.js                    # service worker (offline)
├── icon.svg / icon-192.png / icon-512.png
└── tests/                   # testes (npm test)
    ├── app.test.cjs         # 52 testes de regressão de lógica
    └── dom.test.cjs         # 12 testes de navegação com DOM real (jsdom)
```

> Dependência via CDN: jsPDF 2.5.1 (cacheada pelo service worker após o primeiro uso).
> Com o `FIREBASE_CONFIG` em placeholder, o app roda 100% local.
