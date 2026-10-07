# Comparativo de Preços (transportadoras)

Página única que compara tabelas de preço (antiga × nova) por cidade/UF e faixa de peso.

- Aba A: ADO 1500 a 4500, antiga × nova (Pegaki)
- Aba A2: ADO até 1500 (antiga) × 1500 a 4500 (nova)
- Aba B: comparar outras planilhas (upload de duas planilhas de qualquer transportadora, leitura automática)
- Aba C: histórico de análises; aba D (admin): pedidos de acesso

## Estrutura
- `src/` código da página (app.js, body.html, extra.css, tpl10.html)
- `data/` dados embutidos das abas A e A2
- `tests/` mock do banco e teste Playwright
- `dist/` página montada
- `docs/` skill do fluxo de trabalho

## Build
`npm install && python3 build.py`

## Versão web (Supabase) — pasta `web/`
Site estático com login por link no e-mail e liberação pelo administrador. Os preços NÃO ficam no código: ficam no Supabase (tabela `comparativos`) e só são lidos por quem estiver liberado (RLS).
- Projeto Supabase: `comparativo-preco` (ref `vqzdjgoptsqvpolzhljv`, região sa-east-1)
- Tabelas: `admins`, `acessos` (pendente/liberado/negado), `comparativos` (dados das abas A e A2), `docs` (histórico)
- Primeiro administrador: fernandooliveiracruz1984@gmail.com (libera os demais na aba Acessos)
- Build: `npm install xlsx@0.18.5 && python3 build_web.py` → `web/index.html` + `web/app.bundle.js`
- Teste: `python3 tests/web_test.py` (Supabase simulado)
- Publicação: servir a pasta `web/` (GitHub Pages ou Vercel). No Supabase, em Authentication → URL Configuration, definir Site URL e Redirect URLs com o endereço publicado.
- Primeiro acesso do admin: a tela pede os arquivos `data/data.json` e `data/data2.json` para publicar as tabelas no banco.

## Próximos passos (histórico)
Migrar o controle de acesso para Supabase (login + liberação) e publicar via Vercel/GitHub Pages. Os dados de preço devem sair do HTML e ir para o banco.

Estado atual: versão publicada como artifact do Claude (pedido de acesso dentro da página).
