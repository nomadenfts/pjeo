# pjeo — Calculadora Mobile

Calculadora mobile recriada em **HTML, CSS e JavaScript puros** (arquivo único, sem dependências externas).

## Como usar

- **Celular/preview:** abra `calculadora-mobile.html` (ou `index.html`, que redireciona para ela).
- **Local:** basta abrir o arquivo no navegador, ou servir a pasta:
  ```bash
  python3 -m http.server 8000
  # → http://localhost:8000
  ```

## Funcionalidades

- ➕ Operações: soma, subtração, multiplicação, divisão (com precedência correta)
- % Percentual inteligente: `200 + 10% = 220` (estilo calculadoras de celular)
- 🔢 Números até 12 dígitos, formatação pt-BR (`1.234,56`)
- 🔍 Prévia do resultado em tempo real enquanto você digita
- ↩️ `=` repete a última operação (ex.: `8 × 4 =` → `32`, `=` → `128`)
- ⌫ Backspace para corrigir dígito a dígito
- 🕘 Histórico dos últimos 40 cálculos (persistido em `localStorage`; toque num item para reutilizar o resultado)
- ⌨️ Suporte a teclado físico: `0–9`, `+ − * /`, `Enter` (=), `Backspace`, `Esc` (AC), `%`, `F9` (±)
- 📱 Layout mobile-first com moldura de telefone no desktop, barra de status com relógio, safe areas para iPhone (notch)
- ♿ Acessível: `aria-label`s, foco visível, `aria-live` no visor
- 🐛 Tratamento de erros: divisão por zero exibe mensagem amigável
- Vibração sutil ao tocar (em aparelhos que suportam)

## Estrutura

```
pjeo/
├── index.html               # redireciona para o app
├── calculadora-mobile.html  # o app completo (HTML + CSS + JS)
└── README.md
```
