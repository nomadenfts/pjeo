# pjeo — Calculadora de Rótulos V3

App mobile de **cotação digital para impressão de rótulos** — arquivo único em HTML/CSS/JS, sem build.
Autor do código original: **Daniel Souza** (v16.0).

## Como usar

- **Preview:** o servidor da porta 8000 abre `index.html`, que redireciona para `calculadora-mobile.html`.
- **Local:** abra o arquivo direto no navegador, ou sirva a pasta:
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000
  ```

## Funcionalidades

- 🧮 **Cotação**: dimensões (largura × altura × gap), quantidade, material e modo de impressão
  (Rascunho 300×600, Produção 600×600, Alta 600×900, Máxima 1200×1200)
- 📐 **Rendimento por m²**: etiquetas por m² (com área útil configurável) + conversor m² ⇄ etiquetas
- 🎨 **Cores CMYK + branco** com cobertura (20–100%) e purga/limpeza
- 💼 **Comercial**: comissão de vendedor e empresa, frete, preço total e por unidade
- 📊 **Resumo em bottom-sheet** com composição completa de custos (material + ICMS, tinta, máquina por tempo)
- 📄 **PDF** profissional (jsPDF) com logo da empresa, 📤 **compartilhar** (Web Share/clipboard)
- 📜 **Histórico** com filtros por vendedor e data, reabrir cotação, **exportar CSV**
- 👥 **Vendedores** com comissão personalizada
- ⚙️ **Admin protegido por PIN** (padrão `1234`): materiais (R$/m² + ICMS), custos/velocidade por modo,
  hora-máquina, margem de perda, logo, backup JSON exportar/importar, restaurar padrões
- ☁️ **Sync Firebase opcional** — preencha `FIREBASE_CONFIG` no código (ou siga no modo 📴 LOCAL,
  que persiste tudo em `localStorage`)

## Estrutura

```
pjeo/
├── index.html               # redireciona para o app
├── calculadora-mobile.html  # o app completo (HTML + CSS + JS)
└── README.md
```

> Dependências via CDN: Firebase 10.12.2 (compat) e jsPDF 2.5.1. Sem internet, o app
> funciona em modo local — apenas PDF e sync na nuvem ficam indisponíveis.
