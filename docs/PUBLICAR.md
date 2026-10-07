# Publicar o comparativo (passo a passo)

Antes de tudo: a pasta `web/` NÃO tem preços (eles ficam no Supabase). Já `data/` e `dist/` têm os preços, por isso o repositório principal deve ficar **privado**.

## Parte 1 — Enviar o projeto para o GitHub (privado)
1. Descompacte `comparativo-precos.zip` e abra um terminal dentro da pasta `comparativo-precos`.
2. Rode, um por vez:
   ```
   git remote set-url origin https://github.com/FCO2330/comparativo-preco.git
   git pull origin main --allow-unrelated-histories --no-edit
   git push -u origin main
   ```
   (o `pull` junta o README e o zip que você subiu pela tela do GitHub com o histórico do projeto; se aparecer conflito no README, mantenha o do projeto).
3. Se o GitHub pedir senha, use seu usuário e um token novo (Settings → Developer settings → Personal access tokens). Revogue o token antigo.
4. Opcional: apague o `comparativo-precos.zip` que você subiu pela tela, para não duplicar arquivos.

## Parte 2 — Publicar o site (recomendado: Vercel, aceita repositório privado)
1. Entre em vercel.com com sua conta GitHub (plano Hobby gratuito).
2. **Add New → Project → Import** o repositório `comparativo-preco`.
3. Configure:
   - Framework Preset: **Other**
   - Root Directory: **web**
   - Build Command: deixe vazio
   - Output Directory: deixe vazio (ou `.`)
4. Clique em **Deploy**. A Vercel dá um endereço como `https://comparativo-preco.vercel.app`.

### Alternativa: GitHub Pages
O Pages gratuito só publica repositório **público**, então use um repositório separado só com o conteúdo de `web/` (sem preços):
1. Crie um repositório público `comparativo-web` e copie para ele apenas o conteúdo da pasta `web/`.
2. Settings → Pages → Source: branch `main`, pasta `/ (root)`.
3. Endereço: `https://fco2330.github.io/comparativo-web/`.

## Parte 3 — Ligar o login ao endereço publicado (Supabase)
1. Abra supabase.com → projeto **comparativo-preco** → **Authentication → URL Configuration**.
2. Em **Site URL**, cole o endereço do site publicado (ex.: `https://comparativo-preco.vercel.app`).
3. Em **Redirect URLs**, adicione o mesmo endereço e `https://comparativo-preco.vercel.app/**`.
4. Salve. Sem este passo o link enviado por e-mail não volta para a página.
5. (Recomendado) **Authentication → Providers → Email**: mantenha "Confirm email" ligado e o login por link mágico (OTP) ativo.

## Parte 4 — Primeiro acesso e teste
1. Abra o site e entre com `fernandooliveiracruz1984@gmail.com` (clique no link recebido por e-mail).
2. A tela pedirá os arquivos `data/data.json` (aba A) e `data/data2.json` (aba A2). Selecione e clique em **Publicar**. Feito uma vez.
3. Abra o site em outra janela anônima com outro e-mail: deve aparecer **Aguardando liberação**.
4. No seu acesso, abra a aba **Acessos**, clique em **Liberar**. A janela anônima abre as tabelas sozinha em até 6 segundos.

## Problemas comuns
- Link do e-mail abre em branco ou volta para o login: confira Site URL e Redirect URLs (Parte 3).
- E-mail não chega: veja o spam. O Supabase gratuito limita o envio (poucos e-mails por hora); para uso maior, configure um SMTP próprio em Authentication → SMTP Settings.
- "Dados ainda não publicados": o administrador ainda não fez o passo 2 da Parte 4.
