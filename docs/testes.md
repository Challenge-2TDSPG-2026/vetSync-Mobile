# Plano de testes do VetSync Mobile

Este documento reúne os testes automatizados e manuais necessários para validar o aplicativo antes de uma entrega. Marque `[x]` somente depois de executar o teste e registrar evidência quando aplicável.

## Como executar as validações automatizadas

Use Node.js compatível com o CI e instale as dependências antes da primeira execução:

```bash
npm ci
npm test -- --runInBand
npm run typecheck
npm run lint
npm run format:check
npm run build
```

`npm run build` gera a versão web (`expo export -p web`). Ele não substitui a validação em Android/iOS nativos.

### Critérios automatizados

- [ ] Todas as suítes Jest passam, sem testes ignorados inesperados.
- [ ] TypeScript termina sem erros.
- [ ] ESLint termina sem erros; revisar e justificar avisos.
- [ ] Formatação passa.
- [ ] Export web termina e gera os arquivos esperados.
- [ ] CI executa os mesmos comandos e fica verde para o commit da entrega.
- [ ] Ao corrigir defeito, existe teste de regressão cobrindo o caso corrigido.

## Inventário da cobertura automatizada existente

Os arquivos abaixo indicam áreas que já possuem suítes. A presença de uma suíte não garante cobertura de todos os casos; os critérios funcionais deste documento complementam esses testes.

| Área | Arquivos de teste |
|---|---|
| Autenticação e sessão | `context/__tests__/AuthContext.test.ts`, `services/__tests__/authService.test.ts`, `services/__tests__/authServiceGoogle.test.ts`, `services/__tests__/biometriaService.test.ts`, `constants/__tests__/googleAuth.test.ts` |
| Cliente HTTP | `services/api/__tests__/httpClient.test.ts`, `services/api/__tests__/httpClientCorpo.test.ts` |
| Pets e acesso compartilhado | `services/__tests__/petService.test.ts`, `services/__tests__/petMapper.test.ts`, `services/__tests__/petAcessoService.test.ts`, `services/__tests__/petAtividadeService.test.ts`, `services/__tests__/petHealthService.test.ts`, `utils/__tests__/petAtivo.test.ts`, `utils/__tests__/salvarPetComPerfil.test.ts` |
| Eventos, agenda e lembretes | `services/__tests__/eventoService.test.ts`, `services/__tests__/calendarService.test.ts`, `services/__tests__/planoLembreteService.test.ts`, `utils/__tests__/planoPreventivo.test.ts`, `utils/__tests__/reagendamento.test.ts`, `utils/__tests__/ultimaAtualizacao.test.ts` |
| Clínica, veterinário e espera | `services/__tests__/veterinarioService.test.ts`, `services/__tests__/catalogoService.test.ts`, `services/__tests__/listaEsperaService.test.ts`, `utils/__tests__/listaEspera.test.ts`, `utils/__tests__/atendimentoVet.test.ts`, `utils/__tests__/solicitacao.test.ts` |
| Carteira e prontuário | `services/__tests__/carteiraCompartilhadaService.test.ts`, `utils/__tests__/carteiraPdf.test.ts`, `utils/__tests__/carteiraPdfFoto.test.ts`, `utils/__tests__/prontuario.test.ts`, `utils/__tests__/prontuarioPdf.test.ts`, `utils/__tests__/resumoEmergenciaPdf.test.ts` |
| Notificações e push | `services/__tests__/notificationService.test.ts`, `services/__tests__/pushNotificationService.test.ts`, `utils/__tests__/notificacaoRota.test.ts` |
| Assistente, recompensas e fluxo social | `services/__tests__/iaService.test.ts`, `services/__tests__/recompensaService.test.ts`, `services/__tests__/googlePendente.test.ts`, `utils/__tests__/cadastroGoogle.test.ts`, `utils/__tests__/loginSocial.test.ts` |
| Cache, navegação e scripts | `storage/__tests__/cacheOffline.test.ts`, `utils/__tests__/navegacao.test.ts`, `utils/__tests__/planoNavegacao.test.ts`, `scripts/__tests__/validate-commit-hash.test.js` |

Ao criar ou remover suítes, atualize este inventário. Para confirmar os nomes atuais:

```bash
rg --files -g "*.test.*" -g "*.spec.*"
```

## Testes manuais: instalação e inicialização

- [ ] Instalar o APK/IPA de distribuição em um dispositivo compatível e abrir o aplicativo.
- [ ] Confirmar que a splash termina e a primeira tela abre sem travamento.
- [ ] Confirmar nome, versão, build e hash do commit na tela “Sobre o App”.
- [ ] Confirmar que o hash exibido corresponde ao commit usado para gerar o artefato.
- [ ] Repetir a abertura após encerrar o aplicativo e após reiniciar o dispositivo.
- [ ] Conferir orientação, áreas seguras, teclado, fontes e acessibilidade nas telas principais.
- [ ] Executar os fluxos nativos em build de desenvolvimento ou distribuição; Expo Go não substitui o build quando há módulos nativos ou configuração de permissões.

## Testes manuais: autenticação e conta

- [ ] Login de tutor com credenciais válidas e inválidas.
- [ ] Login de veterinário e de administrador, se habilitado no ambiente.
- [ ] Cadastro com dados válidos; rejeição de campos obrigatórios inválidos, e-mail duplicado e documento inválido.
- [ ] Recuperação de senha, validação de código e redefinição com senha válida/inválida.
- [ ] Login, cadastro e vinculação via Google: sucesso, cancelamento, token expirado e conta já existente.
- [ ] Vínculo inicial do tutor com clínica, incluindo sucesso, erro e retomada após fechar o app.
- [ ] Logout: retorna ao login, limpa dados privados em memória/cache e permite novo login.
- [ ] Expiração/invalidade da sessão: encerra a sessão local e pede autenticação novamente.
- [ ] Login biométrico em dispositivo com biometria cadastrada: ativar, confirmar, sair, entrar, cancelar e falhar autenticação.
- [ ] Biometria sem hardware, sem cadastro, bloqueada, removida após ativação e sessão protegida ausente/corrompida.
- [ ] Confirmar que a senha não é armazenada em texto puro e que a sessão biométrica é removida ao desativar ou sair.
- [ ] Verificar comportamento após reinstalação/atualização e após alteração das biometrias cadastradas no aparelho.

## Testes manuais: tutor e dados dos pets

- [ ] Concluir onboarding e selecionar o pet ativo; alternar entre pets e confirmar atualização dos dados exibidos.
- [ ] Cadastrar pet com campos válidos e inválidos; editar dados e salvar/cancelar.
- [ ] Adicionar, substituir e remover foto; testar negação de permissão e imagem indisponível.
- [ ] Consultar perfil, dados de saúde, histórico de atividades e histórico de cuidados.
- [ ] Criar, editar, concluir, reagendar e excluir evento; verificar confirmação e atualização da lista/detalhe.
- [ ] Criar eventos de vacina, consulta, medicamento e cuidado, incluindo datas passadas/futuras e campos opcionais.
- [ ] Adicionar evento ao calendário; testar permissão concedida/negada e calendário indisponível.
- [ ] Criar lembrete local, validar horário/fuso, recebimento e cancelamento ao editar/excluir o evento.
- [ ] Abrir carteira de vacinação, conferir dados e gerar/compartilhar PDF com e sem foto.
- [ ] Testar compartilhamento de acesso: convidar, aceitar/recusar, revogar e validar permissões do responsável.
- [ ] Testar clínica: busca, catálogo, serviços, perfil e logo; estados sem resultado e erro de rede.
- [ ] Testar lista de espera: solicitar, consultar posição/status, cancelar e reagendar quando disponível.
- [ ] Testar recompensas: consultar saldo, catálogo, resgatar, tratar saldo insuficiente e acompanhar status.
- [ ] Testar assistente com pergunta válida, ausência de conexão, resposta vazia/erro e limites de conteúdo.
- [ ] Testar modo simples: habilitar, navegar, executar ação disponível e retornar ao modo completo.

## Testes manuais: veterinário

- [ ] Login e direcionamento para a área veterinária.
- [ ] Dashboard com dados, estado vazio, carregamento e erro.
- [ ] Lista de pacientes: busca, filtros, paginação/atualização e ausência de resultados.
- [ ] Abrir paciente e conferir dados autorizados, histórico, carteira e resumo de emergência.
- [ ] Consultas/atendimentos: criar ou atualizar, validar campos, status e feedback de sucesso/erro.
- [ ] Configurar disponibilidade e conferir conflitos, horários inválidos e persistência após reabrir.
- [ ] Editar perfil profissional e validar campos obrigatórios.
- [ ] Consultar relatórios e resgates pendentes; concluir ou tratar falha conforme permissões.
- [ ] Confirmar que rotas exclusivas do tutor não ficam acessíveis ao veterinário.

## Testes manuais: notificações, permissões e plataforma

- [ ] Conceder e negar permissões de câmera, fotos, calendário e notificações; confirmar alternativas e mensagens.
- [ ] Registrar token push após login e remover/desativar conforme logout/resposta inválida do serviço.
- [ ] Receber notificação com o app em foreground e conferir apresentação.
- [ ] Receber notificação com o app em background/encerrado; tocar e abrir a tela/registro relacionado.
- [ ] Validar notificação realista de vacina, consulta ou retorno e evitar navegação para recurso inexistente.
- [ ] Revalidar as permissões nativas em Android e iOS após alteração de configuração/plugin.
- [ ] Testar versões mínimas suportadas e aparelhos sem os recursos nativos opcionais.
- [ ] Validar a experiência web separadamente; recursos exclusivos nativos devem informar indisponibilidade adequadamente.

## Testes manuais: erros, rede e apresentação

- [ ] Conferir carregamento, estado vazio, erro e ação de tentar novamente em cada tela principal.
- [ ] Desconectar a rede durante leitura e gravação; reconectar e verificar recuperação sem duplicar dados.
- [ ] Validar cache offline: exibição de dados permitidos, validade e limpeza após logout/troca de conta.
- [ ] Conferir mensagens de erro compreensíveis sem expor token, senha ou dados internos.
- [ ] Conferir tema claro/escuro em login, fluxos do tutor e do veterinário.
- [ ] Conferir acessibilidade: rótulos de controles, ordem de foco, contraste e aumento de fonte.
- [ ] Confirmar que todos os botões/atalhos executam uma ação e que telas entregues anteriormente continuam acessíveis.
- [ ] Verificar que ações destrutivas têm confirmação e que cancelamento não altera dados.

## Testes manuais: publicação e demonstração

- [ ] Instalar e abrir o artefato publicado pelo canal de distribuição.
- [ ] Validar configuração de ambiente, URL da API e login com backend real.
- [ ] Comparar versão, build e hash do app com os metadados do artefato publicado.
- [ ] Demonstrar um fluxo completo do tutor, incluindo pet e evento.
- [ ] Demonstrar um fluxo completo do veterinário.
- [ ] Demonstrar notificação e navegação pelo toque, carteira/histórico ou recompensa, tema e modo simples.
- [ ] Gravar vídeo na mesma versão validada e publicar o link junto da entrega.

## Registro de execução

| Data | Commit/build | Ambiente e dispositivo | Comandos/testes | Resultado/evidência | Responsável |
|---|---|---|---|---|---|
| | | | | | |

## Histórico já registrado na documentação de entrega

- Em 19/10/2026 foram registrados typecheck sem erros, lint sem erros (com seis avisos), build web concluído e 43 suítes/287 testes passando.
- Esse resultado é histórico e não comprova o estado do commit atual. Registre uma nova execução antes de aprovar a entrega.
