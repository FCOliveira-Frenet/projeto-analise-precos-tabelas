---
name: comparativo-tabelas-preco
description: Use when comparing carrier/freight price tables (old vs new, any transportadora, e.g. Pegaki/Frenet ADO), building or updating the comparison page with history, or after finishing such a job to record lessons.
version: 1.1.0
---

# Comparativo de tabelas de preço (transportadoras)

## Resumo executivo
Entregar uma página única e online (artifact HTML, mesmo link a cada republicação) que compara duas tabelas de preço (antiga × nova) de qualquer transportadora, destaca diferenças, aponta cidades faltantes e guarda histórico conferível. Referência viva: https://claude.ai/artifact/79Hkrg44XZ6Jiof4SkAMoR (Pegaki, ADO).

## 1. Antes de começar
1. Identificar as duas bases e as abas a comparar. A comparação correta costuma ser entre abas diferentes da mesma planilha (ex.: "ADO até 1500" antiga × "ADO 1500-4500" nova). Se houver dúvida sobre quais abas, perguntar uma vez.
2. Ler transportadora e data a partir do nome do arquivo, das abas e do conteúdo. Nunca pedir ao usuário o que está no arquivo.

## 2. Estrutura da página (abas, nesta ordem)
- **A**: comparação principal (dados embutidos).
- **A2**: comparações adicionais embutidas (ex.: antiga até 1500 × nova 1500-4500, que revela cidades só com preço na nova).
- **B "+ Comparar outras planilhas"**: upload de duas planilhas de qualquer transportadora, com detecção automática de cabeçalho, colunas (cidade, UF, cluster, faixas de peso, preços), transportadora e data.
- **C "Histórico"**: toda análise salva automaticamente (capacidades `db` + `user`), reabrível, com marcação "conferida" e anotações.

## 3. Layout obrigatório (simples, sem redesenhos)
- Uma linha por cidade: cidade, UF; por faixa de peso três colunas lado a lado: Antigo | Novo | % Dif.
- Coluna "Novo" com cor própria. Diferenças em vermelho (aumento) e azul (desconto).
- Nome da transportadora ao lado do título e no cabeçalho da análise, com a data de cada base.
- Barra de resumo "N cidades têm diferença de preço" com cartões clicáveis: Descontos, Acréscimos, Iguais, Variação média geral; "ver na tabela" filtra.
- Card de itens vazios/novos: ao clicar, mostrar SOMENTE essas cidades.
- Abas em formato pílula: hover muda de cor; aba selecionada com fundo cheio.
- Tema claro/escuro por tokens CSS; responsivo.

## 4. Regras de cálculo
- % Dif = (novo − antigo) ÷ antigo; abaixo de 0,005% tratar como igual.
- Casamento de linhas por cidade normalizada (sem acento/caixa) + UF.
- Preços aceitam "R$ 1.234,56"; pesos aceitam números, "Até 0,5 kg", gramas e "adicional".
- Não misturar categorias: "sem preço na antiga", "sem preço na nova" e "sem cluster" ficam separadas.

## 5. Implementação (artifact)
- Um arquivo HTML, tudo inline (SheetJS embutido; só Google Fonts externo). Sem doctype/html/head/body ao publicar.
- Histórico: documentos de até 256 KiB, divididos em blocos de ~60 linhas; id por hash de arquivos/abas/contagens; deduplicar quando a aba é reselecionada.
- Republicar com a mesma `url`; não repassar `capabilities` salvo para alterá-las.

## 6. Verificação antes de publicar
- Checagem de sintaxe do JS e teste com Playwright usando mock do `db`: carregar as planilhas reais, conferir contagens (cidades comuns, diferenças, média), cliques nos filtros, aba Histórico, console sem erros.
- Capturas de tela em claro e escuro (altura dos cartões, cores). Validar totais contra cálculo independente.

## 7. Resposta ao usuário
1–2 frases com o resultado (nº de cidades, variação média). Sem colar o link se não pedirem. Dizer o que não foi testado (ex.: gravação real do histórico).

## 8. Melhoria contínua (protocolo)
Uma skill não edita a si mesma. Ao fim de cada trabalho de comparativo:
1. Listar o que o usuário corrigiu ou pediu de novo (feedback) e erros encontrados.
2. Transformar cada item em regra curta e verificável nas seções 3–6.
3. Propor a nova versão completa com `propose_skills` (kind: improvement), somando uma linha ao Registro abaixo e subindo a versão.
4. Atualizar a memória do projeto com a decisão do usuário, se ele confirmar.

## 9. Registro de aprendizados
- 1.0.0: layout simples (linha por cidade, Antigo|Novo|% Dif lado a lado); abas A, A2, B, C.
- 1.1.0: ao focar cidades "só na nova", mostrar apenas elas; coluna Novo colorida; transportadora lida do arquivo; resumo com descontos/acréscimos; abas com hover e seleção; caixa de resumo não pode esticar (usar display:block em vez de flex coluna com wrap).
