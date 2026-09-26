# Documentação da API - VetSync

Esta documentação lista todos os endpoints RESTful necessários para substituir o armazenamento local (mockado via `AsyncStorage`) por um backend real na nuvem. 

## 1. Autenticação e Perfil de Usuário
Gerencia o registro, sessões e preferências dos usuários (Tutores e Veterinários).

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/registrar` | Cria uma conta e retorna token de sessão JWT. Requer email, senha e tipo (tutor/veterinario). |
| `POST` | `/api/auth/login` | Autentica o usuário e retorna o token de sessão e dados do perfil. |
| `POST` | `/api/auth/recuperar-senha` | Envia por e-mail um link para redefinição de senha. Não exige autenticação. |
| `POST` | `/api/auth/logout` | Invalida o token de sessão atual no servidor. |
| `GET` | `/api/auth/me` | Retorna os dados do usuário autenticado validando se o token está ativo. |
| `PUT` | `/api/usuarios/preferencias`| Atualiza preferências de UI, onboarding concluído e notificações locais. |

---

## 2. Pets
Gerenciamento do cadastro dos animais de estimação.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/pets` | Lista todos os pets vinculados ao usuário autenticado. |
| `GET` | `/api/pets/:id` | Retorna todos os detalhes (peso, espécie, raca, etc) de um pet específico. |
| `POST` | `/api/pets` | Adiciona um novo pet ao perfil do tutor. |
| `PUT` | `/api/pets/:id` | Atualiza os dados de um pet existente. |
| `DELETE` | `/api/pets/:id` | Remove o pet do cadastro do usuário. |

---

## 3. Eventos (Agendamentos e Histórico)
Gerencia vacinas, consultas, checkups, vermífugos e demais interações.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/eventos` | Lista eventos. Suporta parâmetros de busca como `?petId=123` ou `?veterinarioId=456`. |
| `POST` | `/api/eventos` | Cria uma solicitação de evento/agendamento. |
| `PATCH` | `/api/eventos/:id/confirmar`| O veterinário atualiza o status do evento para `confirmado` vinculando seu ID e hora. |
| `PATCH` | `/api/eventos/:id/concluir` | O veterinário muda o status para `concluido` e insere observações clínicas. |
| `PATCH` | `/api/eventos/:id/cancelar` | Muda o status do evento para `cancelado` adicionando o motivo do cancelamento. |
| `DELETE` | `/api/eventos/:id` | Exclusão física/lógica de um evento inserido incorretamente. |

---

## 4. Veterinários
Gerenciamento dos perfis dos profissionais.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/veterinarios` | Lista os profissionais disponíveis, possibilitando filtragem por clínica ou especialidade. |
| `GET` | `/api/veterinarios/:id` | Detalhes públicos de um veterinário específico. |
| `POST` | `/api/veterinarios` | Cadastro inicial do perfil do veterinário (nome, crmv, clínica, etc). |
| `PUT` | `/api/veterinarios/:id` | Atualização dos dados profissionais do veterinário. |

---

## 5. Agenda (Disponibilidade e Bloqueios)
Controle dos horários de atendimento dos veterinários.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/veterinarios/:id/disponibilidades`| Lista as faixas de horário em que o veterinário atende (dia da semana, início e fim). |
| `POST`| `/api/veterinarios/:id/disponibilidades`| Adiciona uma nova faixa de horário regular na agenda do veterinário. |
| `DELETE`| `/api/veterinarios/:id/disponibilidades/:faixaId`| Remove uma faixa de horário. |
| `GET` | `/api/veterinarios/:id/bloqueios` | Lista exceções e bloqueios da agenda (feriados, imprevistos, folgas). |
| `POST` | `/api/veterinarios/:id/bloqueios` | Cadastra um novo bloqueio na agenda para impedir marcações em uma data específica. |
| `DELETE`| `/api/veterinarios/:id/bloqueios/:bloqueioId`| Remove um bloqueio previamente configurado. |

---

## 6. Recompensas
Gamificação e fidelização do pet/tutor.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/recompensas` | Lista as recompensas ganhas/disponíveis. |
| `POST` | `/api/recompensas` | Adiciona uma recompensa ao perfil de um pet. |
| `PATCH` | `/api/recompensas/:id/resgatar` | Permite ao tutor registrar que a recompensa foi resgatada, salvando a data da ação. |

---

## 7. Notificações (Opcional, porém Recomendado)
Gerenciamento de Push Notifications centralizado pelo servidor.

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/notificacoes/registrar-token`| O app envia o Expo Push Token do dispositivo autenticado, para que o backend gerencie lembretes remotamente e notifique o proprietário quando um convite de acesso for aceito. |
