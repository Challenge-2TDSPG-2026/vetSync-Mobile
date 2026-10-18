# Checklist da Entrega — 4º Sprint

> VetSync Mobile · Challenge 2026 · atualizado em 15/10/2026 · branch `main`, commit `1e0e044`

Legenda: `[x]` feito · `[ ]` pendente · **(novo 14/10)** = concluído na atualização anterior.

## Atualização de 15/10 — Publicação web no Firebase Hosting

_Não é um item do checklist original (a entrega pede o Firebase App Distribution), mas registra o estado atual do Firebase._

- [x] `firebase init hosting` e `firebase init hosting:github` concluídos; o secret `FIREBASE_SERVICE_ACCOUNT_VETSYNC_76C0E` está configurado no GitHub.
- [x] `firebase.json` usa `dist` como diretório público e rewrite `**` para `/index.html`; `.firebaserc` aponta para `vetsync-76c0e`.
- [x] Workflows de merge e pull request usam `actions/setup-node@v4`, Node 20, cache npm, `npm ci` e `expo export --platform web`.
- [x] O workflow de merge injeta `EXPO_PUBLIC_COMMIT_HASH`, `EXPO_PUBLIC_BUILD_NUMBER` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- [x] Deploy automático na branch `main` concluído com sucesso no commit `1e0e044` (workflow [38735005163](https://github.com/Challenge-2TDSPG-2026/vetSync-Mobile/actions/runs/38735005163)).
- [x] Site publicado: https://vetsync-76c0e.web.app
- [x] Verificado que o aplicativo não possui SDK Firebase/Firestore nas dependências; o uso atual do Firebase é somente Hosting e CI/CD.

### Pendente desta frente

- [ ] Testar login/ações no site publicado e liberar CORS no backend Java (Render) para https://vetsync-76c0e.web.app e https://vetsync-76c0e.firebaseapp.com.
- [ ] Cadastrar EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Secrets do GitHub) e autorizar a URL do site no cliente OAuth do Google.
- [ ] Adicionar um workflow específico de lint ao CI; o workflow de Hosting atual valida build/deploy, mas não executa `npm run lint`.

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
- [ ] Confirmar o recebimento do convite pelo professor.
- [ ] Testar a instalação e a execução do aplicativo publicado.
- [x] Registrar a versão publicada, o build e o hash do commit.
  - _Versão `0.1.0`, build `3`, commit publicado `0ea78bea6930a7d7b5b0896c89db676cd7a58ac`._
- [ ] Garantir que o código entregue no repositório seja o mesmo usado no APK publicado.
  - _O APK foi gerado a partir do commit `0ea78bea6930a7d7b5b0896c89db676cd7a58ac`; conferir e consolidar as alterações locais antes da entrega final._

### Notificações reais

- [ ] Confirmar com o backend o endpoint definitivo para registro do token.
- [ ] Padronizar o endpoint no código e na documentação.
- [ ] Confirmar que o backend está enviando notificações para o dispositivo.
- [ ] Implementar o tratamento de toque na notificação.
- [ ] Navegar para o evento, pet ou tela relacionada ao tocar na notificação.
- [ ] Testar recebimento com o aplicativo em foreground.
- [ ] Testar recebimento com o aplicativo em background.
- [ ] Testar um cenário realista, como lembrete de vacina, consulta ou retorno.
- [ ] Confirmar que a notificação tem impacto real no fluxo do aplicativo.
- [ ] Avaliar a remoção do token no logout ou quando ele se tornar inválido.

## Prioridade 2 — Validação funcional completa

### Fluxo do tutor

- [ ] Validar login com backend real.
- [ ] Validar cadastro de usuário.
- [ ] Validar recuperação e redefinição de senha.
- [ ] Validar vínculo com clínica.
- [ ] Validar cadastro de pet.
- [ ] Validar edição dos dados do pet.
- [ ] Validar inclusão e edição da foto do pet.
- [ ] Validar criação de evento.
- [ ] Validar edição e exclusão de evento.
- [ ] Validar conclusão de evento.
- [ ] Validar inclusão do evento no calendário.
- [ ] Validar agendamento de lembretes locais.
- [ ] Validar carteira de vacinação.
- [ ] Validar geração e compartilhamento do PDF da carteira.
- [ ] Validar histórico de cuidados.
- [ ] Validar responsáveis e compartilhamento de acesso.
- [ ] Validar recompensas e resgates.
- [ ] Validar assistente.
- [ ] Validar tela de notificações.
- [ ] Validar biometria.
- [ ] Validar modo simples.
- [ ] Validar tema claro e escuro.
- [ ] Validar logout e novo login.

### Fluxo do veterinário

- [ ] Validar login como veterinário.
- [ ] Validar dashboard do veterinário.
- [ ] Validar lista de pacientes.
- [ ] Validar busca e filtros de pacientes.
- [ ] Validar detalhes do paciente.
- [ ] Validar consultas.
- [ ] Validar disponibilidade.
- [ ] Validar perfil do veterinário.
- [ ] Validar relatórios.
- [ ] Validar resgates pendentes.

### Estados e qualidade de uso

- [ ] Testar estados de carregamento.
- [ ] Testar estados vazios.
- [ ] Testar mensagens de erro.
- [ ] Testar perda e recuperação de conexão.
- [ ] Confirmar que nenhuma tela principal é apenas visual.
- [ ] Confirmar que não existem fluxos interrompidos ou botões sem ação.
- [ ] Confirmar que telas entregues nas sprints anteriores continuam disponíveis.

## Prioridade 3 — Qualidade técnica

### Arquitetura e organização

- [ ] Confirmar que as telas não fazem chamadas HTTP diretamente.
- [ ] Confirmar que regras reutilizáveis estão em hooks ou serviços.
- [ ] Remover duplicações relevantes entre telas.
- [ ] Revisar componentes ou ações marcados como “Em breve”.
- [ ] Padronizar nomes e responsabilidades dos serviços.
- [ ] Padronizar endpoints e exemplos da documentação.
- [ ] Revisar mensagens de erro e evitar falhas silenciosas.

### Validação automatizada

- [x] Instalar dependências com `npm ci`.
  - _Executado localmente e no workflow de deploy; verificado em 15/10/2026._
- [x] Executar `npm run typecheck`.
  - _0 erros, verificado em 15/10/2026 no commit `1e0e044`._
- [x] Executar `npm run lint`.
  - _0 erros e 6 avisos de regras de hooks/importação/estilo; executado em 15/10/2026._
- [x] Executar `npm test`. **(novo 14/10)**
  - _42 suítes / 281 testes passando (14/10)._
- [x] Executar `npm run build`. **(novo 14/10)**
  - _expo export -p web gera 46 arquivos; deploy no Firebase Hosting verde._
- [x] Corrigir os erros de lint encontrados sem alterar funcionalidades não relacionadas.
- [ ] Reexecutar todas as validações após as correções.

### Build e ambiente

- [ ] Validar o aplicativo em build nativo, não apenas no Expo Go.
- [ ] Confirmar as permissões de calendário, câmera, fotos e notificações.
- [ ] Confirmar o `projectId` do Expo usado no build.
- [ ] Confirmar o `version` e o `versionCode` finais.
- [ ] Confirmar que as variáveis de ambiente necessárias estão configuradas.
  - _Pendente: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no GitHub Secrets (login Google na web). EXPO_PUBLIC_API_BASE_URL tem fallback no código._
- [ ] Guardar os dados do build publicado para referência da equipe.

## Prioridade 4 — Documentação e apresentação

### README

- [ ] Atualizar o título e a descrição da Sprint 3 para a Sprint 4.
- [ ] Atualizar a lista de funcionalidades finais.
- [ ] Documentar como executar o projeto.
- [ ] Documentar como executar os testes e validações.
- [ ] Documentar o fluxo de notificações.
- [ ] Documentar o processo de publicação.
- [ ] Adicionar a versão e o hash do commit publicado.
- [ ] Adicionar o link atualizado do vídeo final.
- [ ] Adicionar o link ou instruções de acesso ao Firebase App Distribution.
  - _Ainda sem App Distribution. O link do site (Hosting) pode entrar no README como complemento._

### Vídeo final

- [ ] Gravar o vídeo a partir da mesma versão publicada.
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