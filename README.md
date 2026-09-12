# ClyvoVet (VetSync) — Mobile Application

**FIAP Challenge 2026 — 2º Ano ADS — 3º Semestre**
**Disciplina: Mobile Application Development — Entrega Sprint 3**

Aplicativo mobile em React Native (Expo Router) para o desafio proposto pela **CLYVO VET**, com experiências completas de **Tutor** e **Veterinário** integradas a um backend real em Spring Boot.

---

## 🎥 Vídeo de Demonstração

> **[INSERIR LINK DO VÍDEO NO YOUTUBE AQUI]**

O vídeo demonstra: navegação entre telas, autenticação (login de tutor e veterinário), integração com a API backend (agendamento, conclusão e cancelamento de eventos, CRUD de pets) e o app rodando em dispositivo/emulador real.

---

## Sobre o Projeto

O problema atacado pela CLYVO VET é a **descontinuidade do cuidado veterinário**: o tutor normalmente só aciona a clínica em emergências ou gatilhos óbvios (vacinação), negligenciando o acompanhamento preventivo contínuo.

O **ClyvoVet** resolve isso unificando, em um único aplicativo, a jornada de saúde do pet e a rotina da clínica:

- O **tutor** cadastra pets, agenda e acompanha eventos de saúde (vacinas, consultas, vermífugos, check-ups), consulta a carteira de vacinação digital e participa de um programa de fidelidade com pontos e recompensas.
- O **veterinário** enxerga sua agenda, atende pacientes, conclui ou cancela consultas, define horários de disponibilidade/bloqueios e valida resgates de recompensas.

Diferente do protótipo da Sprint 1 e 2 (dados mockados em `AsyncStorage`), a Sprint 3 substitui toda a persistência local por **chamadas HTTP reais** a uma API Spring Boot, com autenticação por sessão, estados de carregamento e atualização automática de dados via TanStack Query.

---

## Funcionalidades Principais

### Área do Tutor
- **Login e sessão persistente** — perfil determina automaticamente o destino (Tutor ou Veterinário).
- **Multi-pet** — troca rápida entre pets cadastrados (`PetSwitcher`), cadastro de novo pet.
- **Dashboard** — pendentes, realizados, atrasados e próximos eventos.
- **Agenda de Saúde** — calendário mensal, filtros por categoria (Preventivo, Terapêutico, Bem-estar, Emergência) e por atraso, cancelamento com motivo, remoção de eventos ainda agendados.
- **Agendamento de evento** — seleção de tipo de evento e veterinário vindos da API, data/hora, observação.
- **Histórico Clínico** — linha do tempo agrupada por mês com taxa de conclusão.
- **Carteira de Vacinação digital** — histórico de vacinas por pet.
- **Programa de Fidelidade (Recompensas)** — pontos por evento concluído, catálogo de benefícios, resgate, conquistas e progressão por nível/XP.
- **SIA (assistente de IA)** — chat contextual com o pet ativo, acionável de qualquer tela via tab bar.
- **Perfil** — dados do pet, preferências de notificação, gerenciamento de múltiplos pets, logout.

### Área do Veterinário
- **Painel** — agendados, atendimentos de hoje, alertas de resgates pendentes.
- **Fila de Consultas** — lista de eventos agendados ordenada por data.
- **Pacientes** — busca por nome/raça, ficha clínica completa por pet com histórico de eventos.
- **Conclusão de consulta** — observações clínicas e custo.
- **Disponibilidade** — horários fixos de atendimento por dia da semana e bloqueios de agenda (férias, imprevistos).
- **Resgates** — validação (aprovação/negação) de resgates de recompensa solicitados por tutores.

---

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| React Native | 0.81.5 | Framework mobile |
| Expo | ~54.0.0 | Plataforma e toolchain |
| Expo Router | ~6.0.23 | Navegação baseada em arquivos, com grupos `(tutor)` e `(vet)` |
| TypeScript | ~5.9.2 | Tipagem estática |
| TanStack Query | ^5.90.5 | Cache, requisições HTTP, invalidação e refetch automático |
| AsyncStorage | 2.2.0 | Persistência local de sessão e preferências |
| @expo/vector-icons | ^15.0.3 | Ícones (Ionicons, MaterialCommunityIcons) |
| expo-calendar / expo-notifications | ~15.0.8 / ~0.32.17 | Integração com calendário nativo e lembretes locais |
| React Navigation | ^7.0.14 | Base de navegação sob o Expo Router |

Backend consumido: **VetSync Java** (Spring Boot + Flyway + Oracle), repositório separado.

---

## Arquitetura

O projeto separa claramente interface, estado, regra de negócio e acesso a dados:

```text
app/                        # Rotas (Expo Router)
├── _layout.tsx              # Stack raiz + providers + redirecionamento por perfil/onboarding
├── login.tsx
├── assistente.tsx            # Modal transparente da SIA
├── add-pet.tsx / add-evento.tsx  # Modais de criação
├── paciente/[id].tsx         # Ficha clínica (rota dinâmica, uso do veterinário)
├── (tutor)/                  # Grupo de abas do tutor
│   ├── index.tsx  agenda.tsx  historico.tsx  recompensas.tsx  perfil.tsx
└── (vet)/                    # Grupo de abas do veterinário
    ├── index.tsx  consultas.tsx  pacientes.tsx  disponibilidade.tsx  resgates.tsx  perfil.tsx

context/          # Estado global: AuthContext, PetContext, VetContext
hooks/            # useEventos, usePets, useVeterinario, useRecompensas, useConquistas (TanStack Query)
services/         # authService, petService, eventoService, veterinarioService,
                  # recompensaService, catalogoService, calendarService, iaService
services/api/     # httpClient.ts — cliente HTTP único, tratamento de erros (ApiError)
components/       # AppIcon, PetSwitcher, Calendario, navegação (ClyvoTabBar, AccountHeaderAction), carteira
utils/            # eventoStatus (regras de status/atraso), alert (Alert.alert cross-platform)
constants/        # api, storage, theme, events, gamification, vet
types/            # Modelos de domínio (Pet, Evento, Veterinario, Recompensa, Resgate...)
storage/          # petStorage.ts — únicas chaves ainda locais (pet ativo, onboarding, preferências)
```

### Gerenciamento de Estado
- **AuthContext** — sessão (JWT + perfil TUTOR/VETERINARIO/ADMIN), login/registro/logout, restauração automática via `AsyncStorage`.
- **PetContext** — pets do tutor, pet ativo, eventos do pet ativo, nível/XP de gamificação.
- **VetContext** — dados do veterinário logado, agenda, pacientes agregados a partir dos eventos, disponibilidade e bloqueios.
- Toda leitura/escrita remota passa por **hooks dedicados com TanStack Query** (`useQuery`/`useMutation`), nunca diretamente em componentes de tela.

### Integração com a API
- Cliente HTTP único (`services/api/httpClient.ts`) injeta o token Bearer salvo em `AsyncStorage`, trata timeout, erros de rede e erros de validação (`ApiError`, com mapeamento de mensagens por campo).
- Nenhum dado mockado: pets, eventos, veterinários, tipos de evento, recompensas e resgates vêm exclusivamente da API.
- Mutações (`useAgendarEvento`, `useConcluirEvento`, `useCancelarEvento`, `useRemoverEvento`, `useCriarPet`, `useRemoverPet`, `useResgatar`, `useValidarResgate`, `useAdicionarFaixaDisponibilidade`, etc.) invalidam automaticamente as queries relacionadas — a interface atualiza sem recarregar o app.
- Estados de carregamento (`ActivityIndicator`) em todas as telas que dependem de dados remotos.

### Autenticação
- Login via API real (`POST /auth/login`), sem usuários fixos no código.
- Sessão persistida em `AsyncStorage` e restaurada automaticamente na abertura do app.
- Redirecionamento automático por perfil e bloqueio de rotas internas para usuários não autenticados, controlado em `app/_layout.tsx`.
- Logout limpa sessão local, cache do TanStack Query e notifica o backend.

---

## Configuração e Execução

### Pré-requisitos
- Node.js 18+
- Expo CLI / Expo Go (ou emulador Android/iOS)
- Backend **VetSync Java** rodando localmente (porta `8080`) — ver repositório do backend para instruções

### Passo a passo

```bash
git clone https://github.com/thubrito/Mobile-Application-Development.git
cd Mobile-Application-Development
npm install
npx expo start
```

Execução direta por plataforma:

```bash
npm run android   # Android (emulador ou dispositivo via Expo Go)
npm run ios       # iOS (apenas macOS)
npm run web       # Navegador
```

> A URL da API é resolvida automaticamente em `constants/api.ts`: `http://localhost:8080` para iOS/Web e `http://10.0.2.2:8080` para o emulador Android — não precisa configurar nada manualmente ao rodar localmente.

### Contas de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Tutor | `maria@email.com` | `senha123` |
| Veterinário | `ana.vet@clyvovet.com` | `senha123` |
| Conta de demonstração | `victor150@gmail.com` | `senha123` |

---

## Fluxo de Navegação (principais rotas)

| Rota | Descrição |
|---|---|
| `/login` | Autenticação |
| `/(tutor)` | Dashboard do tutor |
| `/(tutor)/agenda` | Agenda de saúde com calendário e filtros |
| `/(tutor)/historico` | Histórico clínico agrupado por mês |
| `/(tutor)/recompensas` | Programa de fidelidade |
| `/(tutor)/perfil` | Perfil, pets e preferências |
| `/(vet)` | Painel do veterinário |
| `/(vet)/consultas` | Fila de consultas agendadas |
| `/(vet)/pacientes` | Busca e ficha de pacientes |
| `/(vet)/disponibilidade` | Horários e bloqueios de agenda |
| `/(vet)/resgates` | Validação de resgates |
| `/add-pet`, `/add-evento` | Modais de cadastro |
| `/paciente/[id]` | Ficha clínica (rota dinâmica) |
| `/assistente` | SIA — assistente de IA (modal transparente) |

---

## Atendimento aos Requisitos da Sprint 3

| Requisito | Status |
|---|---|
| Navegação com biblioteca dedicada (Expo Router) e rotas explícitas | ✅ |
| Mínimo de 6 telas distintas | ✅ (16+ rotas funcionais) |
| Integração real com API via TanStack Query | ✅ |
| CRUD completo acessível pela interface | ✅ Eventos (agendar / listar / concluir-cancelar / remover) |
| Estados de carregamento e atualização automática (sem reiniciar o app) | ✅ |
| Autenticação real com persistência de sessão | ✅ |
| Proteção de rotas por perfil | ✅ |
| Logout funcional | ✅ |
| Arquitetura com separação de responsabilidades | ✅ |

---

## Autores

| Nome | RM |
|---|---|
| Arthur Brito da Silva | RM562085 |
| Luiz Felipe Flosi dos Santos | RM563197 |
| Pedro Henrique Brum Lopes | RM561780 |

---

## Informações Adicionais

- Projeto desenvolvido exclusivamente com fins acadêmicos e avaliativos para o FIAP Challenge 2026.
- Repositório do backend: **VetSync Java** — `github.com/Challenge-2TDSPG-2026/vetSync-java`