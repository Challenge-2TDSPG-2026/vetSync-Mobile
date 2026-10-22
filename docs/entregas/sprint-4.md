# Checklist da Entrega — 4º Sprint

> VetSync Mobile · Challenge 2026 · atualizado em 22/10/2026 · branch `main` · revisão do repositório no commit `d695aefbbcd5057cbcc6228497d57d102a04377e`

Legenda: `[x]` feito · `[ ]` pendente · **(novo 14/10)** = concluído na atualização anterior.

## Atualização de 15/10 — Publicação web no Firebase Hosting

_Não é um item do checklist original (a entrega pede o Firebase App Distribution), mas registra o estado atual do Firebase._

- [x] `firebase init hosting` e `firebase init hosting:github` concluídos; o secret `FIREBASE_SERVICE_ACCOUNT_VETSYNC_76C0E` está configurado no GitHub.
- [x] `firebase.json` usa `dist` como diretório público e rewrite `**` para `/index.html`; `.firebaserc` aponta para `vetsync-76c0e`.
- [x] Existem workflows separados para CI, deploy no Firebase Hosting (merge e pull request) e distribuição Android; o CI atual usa Node 22 e `npm ci`.
- [x] O workflow de merge injeta `EXPO_PUBLIC_COMMIT_HASH`, `EXPO_PUBLIC_BUILD_NUMBER` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- [x] Deploy automático na branch `main` concluído com sucesso no commit `1e0e044` (workflow [38735005163](https://github.com/Challenge-2TDSPG-2026/vetSync-Mobile/actions/runs/38735005163)).
- [x] Site publicado: https://vetsync-76c0e.web.app
- [x] Verificado que o aplicativo não possui SDK Firebase/Firestore nas dependências; o uso atual do Firebase é somente Hosting e CI/CD.

### Pendente desta frente

- [ ] Validar login/ações no site publicado; há erro no token da API Java. _A configuração OAuth foi confirmada pelo responsável._
- [x] Liberar CORS no backend Java (Render) para https://vetsync-76c0e.web.app e https://vetsync-76c0e.firebaseapp.com.
- [x] Configurar `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` nos Secrets do GitHub e autorizar a URL do site no cliente OAuth do Google.
  - _Confirmado pelo responsável. O login/fluxo web ainda apresenta erro relacionado ao token da API Java; não é pendência de configuração OAuth._
- [x] Confirmar lint no CI; `.github/workflows/ci.yml` executa `npm run lint` junto com typecheck, testes, formatação e build.

## Prioridade 1 — Itens críticos da avaliação

### Tela “Sobre o App” e versionamento

- [x] Criar a tela “Sobre o App”.
- [x] Exibir o nome, a versão e o build do aplicativo.
- [x] Exibir o hash do commit, ou informar explicitamente quando ele não foi configurado.
- [x] Definir a variável de build utilizada para injetar o hash: `EXPO_PUBLIC_COMMIT_HASH`.
- [x] Adicionar a tela ao fluxo de configurações do tutor e ao perfil do veterinário.
- [x] Validar que o hash exibido corresponde exatamente ao commit usado na publicação.

### Publicação no Firebase App Distribution

- [x] Confirmar o projeto Firebase utilizado para a distribuição. **(novo 14/10)**
  - _Projeto vetsync-76c0e (já usado no Hosting). Falta habilitar o App Distribution nele._
- [x] Configurar o Firebase App Distribution no projeto `vetsync-76c0e` (Firebase Hosting já está configurado).
  - _Aplicativo Android cadastrado com o package `com.vetsync.app`; projeto Expo/EAS vinculado à conta `thurbrito`._
- [x] Gerar um APK/ build a partir do commit final.
  - _Versão `0.1.0`, build `3`, perfil EAS `preview`, build concluído em 18/10/2026._
- [x] Publicar o build no Firebase App Distribution.
  - _Release `0tamplp3t5100`, publicada no app Android `1:376247909118:android:334d8f77fb63b6d07903af`._
- [x] Adicionar o e-mail institucional do professor como tester.
  - _Testers cadastrados e convidados: `proflucas.santos@fiap.com.br` e `pf2275@fiap.com.br`._
- [x] Confirmar o recebimento do convite pelo professor.
- [ ] Testar a instalação e a execução do aplicativo publicado.
- [x] Registrar a versão publicada, o build e o hash do commit.
  - _Versão `0.1.0`, build `3`, commit publicado `0ea78bea6930a7d7b5b0896c89db676cd7a58ac`._
- [ ] Garantir que o código entregue no repositório seja o mesmo usado no APK publicado.
  - _O repositório atual está no commit `d695aefbbcd5057cbcc6228497d57d102a04377e` e declara versão `0.1.4`; o README registra o APK como versão `0.1.0`, build `3`, commit `0ea78bea6930a7d7b5b0896c89db676cd7a58ac`. O objeto desse commit publicado não está disponível no clone atual, então não foi possível comparar os códigos. A divergência de versão confirma que o estado atual não está documentado como o APK publicado._

### Notificações reais

- [x] Confirmar com o backend o endpoint definitivo para registro do token.
  - _Confirmado no controller Spring Boot: `POST /notificacoes/dispositivos`, usado pelo app para registrar ou reativar o token do tutor._
- [x] Padronizar o endpoint no código e na documentação.
- [x] Corrigir a lista de notificações para exibir itens lidos e não lidos.
  - _A tela consulta a primeira página sem filtro de leitura (`GET /notificacoes?page=0&size=50`), preserva os filtros opcionais e mantém as ações de marcar como lida._
- [x] Confirmar que o backend está enviando notificações para o dispositivo.
  - _O backend cria a notificação, envia o payload para a API do Expo após o commit da transação e desativa tokens retornados como inválidos. A entrega efetiva no aparelho ainda depende do teste manual._
- [x] Implementar o tratamento de toque na notificação.
- [x] Navegar para o evento, pet ou tela relacionada ao tocar na notificação.
- [ ] Testar recebimento com o aplicativo em foreground.
- [ ] Testar recebimento com o aplicativo em background.
- [ ] Testar um cenário realista, como lembrete de vacina, consulta ou retorno.
- [ ] Confirmar que a notificação tem impacto real no fluxo do aplicativo.
  - _Responsável informou que ainda não realizou testes manuais._
- [x] Avaliar a remoção do token no logout ou quando ele se tornar inválido.
  - _O token registrado é removido pelo endpoint `DELETE /notificacoes/dispositivos/{token}` durante o logout. Se a remoção falhar, ele permanece armazenado para nova tentativa no próximo login._

## Cobertura de testes

A matriz completa de testes manuais de tutor, veterinario, autenticacao, permissoes, notificacoes e estados do aplicativo esta em [docs/testes.md](../testes.md). Registre a execucao nesse documento.

## Prioridade 3 — Qualidade técnica

### Arquitetura e organização

- [x] Confirmar que as telas não fazem chamadas HTTP diretamente.
  - _A tela `minha-clinica` usa `clinicaService` para carregar perfil, serviços e logo autenticada._
- [ ] Confirmar que regras reutilizáveis estão em hooks ou serviços.
- [ ] Remover duplicações relevantes entre telas.
- [x] Revisar estados vazios e opções sem ação.
  - _Catálogo vazio agora permite atualizar; falhas de carregamento têm nova tentativa; atalhos exigem uma ação conectada e datas ausentes são comunicadas com clareza._
- [ ] Padronizar nomes e responsabilidades dos serviços.
- [ ] Padronizar endpoints e exemplos da documentação.
- [ ] Revisar mensagens de erro e evitar falhas silenciosas.

### Validacao automatizada, build e ambiente

Os comandos, criterios automatizados e casos de validacao em dispositivos estao centralizados em [docs/testes.md](../testes.md).

Ultima execucao registrada em 19/10/2026: typecheck sem erros, lint sem erros (seis avisos), build web concluido e 43 suites/287 testes passando. O resultado e historico; nao ha registro de execucao para o commit `d695aef`.

## Prioridade 4 — Documentação e apresentação

### README

- [x] Atualizar o título e a descrição da Sprint 3 para a Sprint 4.
- [x] Atualizar a lista de funcionalidades finais.
- [x] Documentar como executar o projeto.
- [x] Documentar como executar os testes e validações.
- [x] Documentar o fluxo de notificações.
- [x] Documentar o processo de publicação.
- [x] Adicionar a versão e o hash do commit publicado.
- [ ] Adicionar o link atualizado do vídeo final.
- [x] Adicionar o link ou instruções de acesso ao Firebase App Distribution.
  - _Projeto Firebase `vetsync-76c0e`, app Android `com.vetsync.app`, versão `0.1.0`, build `3`; o convite é acessado pelo e-mail do tester ou pelo Firebase App Distribution._

### Vídeo final

- [ ] Gravar o vídeo a partir da mesma versão publicada.
- Link do vídeo: _[inserir aqui quando estiver publicado]_.
- [ ] Demonstrar login e fluxo principal do tutor.
- [ ] Demonstrar cadastro/seleção de pet.
- [ ] Demonstrar criação de evento.
- [ ] Demonstrar lembrete ou notificação real.
- [ ] Demonstrar o toque na notificação e a navegação relacionada.
- [ ] Demonstrar pelo menos um fluxo completo do veterinário.
- [ ] Demonstrar carteira, histórico e/ou recompensas.
- [ ] Demonstrar tema claro/escuro.
- [ ] Demonstrar modo simples.
- [ ] Demonstrar a tela “Sobre o App” com o hash do commit.
- [ ] Verificar que não existem cortes ocultando erros ou etapas inoperantes.
- [ ] Atualizar o link do vídeo no README.

## Critério de encerramento

A entrega só deve ser considerada pronta quando:

- [ ] Todos os itens da Prioridade 1 estiverem concluídos.
- [ ] Os fluxos principais de tutor e veterinário tiverem sido testados do início ao fim.
- [ ] Typecheck, lint, testes e build estiverem aprovados.
- [ ] O APK publicado puder ser instalado e executado pelo professor.
- [ ] O hash exibido no aplicativo corresponder ao build publicado.
- [ ] O README e o vídeo estiverem alinhados com a versão final.
