# Checklist da Entrega — 4º Sprint

> VetSync Mobile · Challenge 2026 · atualizado em 14/10/2026 · branch `main`, commit `6a8513b`

Legenda: `[x]` feito · `[ ]` pendente · **(novo 14/10)** = concluído na atualização de hoje.

## Atualização de 14/10 — Publicação web no Firebase Hosting

_Não é um item do checklist original (a entrega pede o Firebase App Distribution), mas registra o que foi feito hoje no Firebase._

- [x] firebase init hosting e firebase init hosting:github concluídos (secret FIREBASE_SERVICE_ACCOUNT_VETSYNC_76C0E criado). **(novo 14/10)**
- [x] firebase.json com "public": "dist" e rewrite ** → /index.html (commit 25417f3); .firebaserc aponta para vetsync-76c0e. **(novo 14/10)**
- [x] Removido o public/index.html de exemplo do Firebase, que sobrescrevia o index.html do app (commit 6a8513b). **(novo 14/10)**
- [x] Workflows de merge e de pull request com actions/setup-node@v4 (Node 20, cache npm), npm ci e expo export separados. **(novo 14/10)**
- [x] Deploy automático pelo GitHub Actions na branch main concluído (verde). **(novo 14/10)**
- [x] Site publicado: https://vetsync-76c0e.web.app **(novo 14/10)**

### Pendente desta frente

- [ ] Testar login/ações no site publicado e liberar CORS no backend Java (Render) para https://vetsync-76c0e.web.app e https://vetsync-76c0e.firebaseapp.com.
- [ ] Cadastrar EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Secrets do GitHub) e autorizar a URL do site no cliente OAuth do Google.
- [ ] Corrigir os 4 erros de lint para o workflow CI voltar a ficar verde (falha desde o run #36, 13/10).

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
- [ ] Configurar o Firebase App Distribution.
- [ ] Gerar um APK/ build a partir do commit final.
- [ ] Publicar o build no Firebase App Distribution.
- [ ] Adicionar o e-mail institucional do professor como tester.
- [ ] Confirmar o recebimento do convite pelo professor.
- [ ] Testar a instalação e a execução do aplicativo publicado.
- [ ] Registrar a versão publicada, o build e o hash do commit.
- [ ] Garantir que o código entregue no repositório seja o mesmo usado no APK publicado.

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

- [x] Instalar dependências com `npm ci`. **(novo 14/10)**
  - _Executado no workflow de deploy e verificado em 14/10._
- [x] Executar `npm run typecheck`. **(novo 14/10)**
  - _0 erros (verificado em 14/10, commit 25417f3)._
- [ ] Executar `npm run lint`.
  - _4 erros: app/(tutor)/agendar-servico.tsx (linhas 39 e 42) e app/(tutor)/mensagens-clinica.tsx (20 e 21), regra setState dentro de useEffect. É o que deixa o workflow CI vermelho._
- [x] Executar `npm test`. **(novo 14/10)**
  - _42 suítes / 281 testes passando (14/10)._
- [x] Executar `npm run build`. **(novo 14/10)**
  - _expo export -p web gera 46 arquivos; deploy no Firebase Hosting verde._
- [ ] Corrigir erros encontrados sem alterar funcionalidades não relacionadas.
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