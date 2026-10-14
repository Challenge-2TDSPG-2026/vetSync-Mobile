# Documentação da API - VetSync

Esta documentação contém o inventário dos endpoints dos controllers enviado para atualização. Os caminhos são os mapeamentos dos controllers; acrescente `/api` apenas se esse prefixo estiver configurado na aplicação ou no gateway.


---

# Inventário atualizado dos endpoints do backend

Esta seção foi atualizada com base nos mapeamentos `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping` e `@DeleteMapping` enviados. Os caminhos abaixo são os mapeamentos dos controllers; o prefixo `/api` só deve ser acrescentado se estiver configurado na aplicação ou no gateway.

## Ações de IA
| Método | Endpoint |
|---|---|
| `POST` | `/ia/acoes/preview` |
| `POST` | `/ia/acoes/{id}/confirmar` |

## Administração
| Método | Endpoint |
|---|---|
| `POST` | `/admins/bootstrap` |
| `POST` | `/admins` |
| `GET` | `/auditoria` |
| `GET` | `/auditoria/tipos` |
| `GET` | `/painel/resumo` |

## Agenda e agendamentos
| Método | Endpoint |
|---|---|
| `GET` | `/agenda/slots` |
| `GET` | `/agenda/servicos` |
| `GET` | `/agenda/servicos/{idServico}/slots` |
| `POST` | `/agenda/servicos/{idServico}/agendar` |
| `GET` | `/agenda/dia` |
| `GET` | `/agendamentos-retorno/{token}` |
| `POST` | `/agendamentos-retorno/{token}/confirmar` |
| `POST` | `/agenda/espera` |
| `GET` | `/agenda/espera` |
| `DELETE` | `/agenda/espera/{id}` |

## Autenticação e conta
| Método | Endpoint |
|---|---|
| `POST` | `/auth/login` |
| `POST` | `/auth/registrar` |
| `POST` | `/auth/esqueci-senha` |
| `POST` | `/auth/validar-codigo` |
| `POST` | `/auth/redefinir-senha` |
| `POST` | `/auth/logout` |
| `POST` | `/auth/trocar-senha-inicial` |
| `GET` | `/auth/me` |
| `POST` | `/auth/social-login` |
| `POST` | `/auth/social-registrar` |
| `POST` | `/auth/social-vincular` |

## Carteira compartilhada e pública
| Método | Endpoint |
|---|---|
| `POST` | `/pets/{idPet}/carteira-compartilhavel` |
| `GET` | `/pets/{idPet}/carteira-compartilhavel` |
| `DELETE` | `/pets/{idPet}/carteira-compartilhavel/{id}` |
| `GET` | `/carteiras-publicas/{token}` |
| `GET` | `/carteiras-publicas/{token}/foto` |

## Clínica: catálogo, operação, participantes e perfil
| Método | Endpoint |
|---|---|
| `GET` | `/clinica-admin/servicos/modelos` |
| `GET` | `/clinica-admin/servicos` |
| `POST` | `/clinica-admin/servicos` |
| `PUT` | `/clinica-admin/servicos/{idServico}` |
| `GET` | `/clinica-admin/agenda/dia` |
| `POST` | `/clinica-admin/agenda` |
| `PATCH` | `/clinica-admin/agenda/{idEvento}/reagendar` |
| `PATCH` | `/clinica-admin/agenda/{idEvento}/cancelar` |
| `GET` | `/clinica-admin/pontos` |
| `PATCH` | `/clinica-admin/pontos/{idLancamento}/liberar` |
| `GET` | `/clinica-admin/profissionais` |
| `GET` | `/clinica-admin/tutores` |
| `GET` | `/clinica-admin/pets` |
| `GET` | `/clinica-admin/perfil` |
| `PUT` | `/clinica-admin/perfil` |
| `PUT` | `/clinica-admin/perfil/logo` |
| `GET` | `/clinica-admin/perfil/logo` |
| `GET` | `/minha-clinica/perfil` |
| `GET` | `/minha-clinica/logo` |

## Equipe e cargos da clínica
| Método | Endpoint |
|---|---|
| `POST` | `/admin-global/clinicas/{idClinica}/dono` |
| `GET` | `/clinica-admin/equipe` |
| `POST` | `/clinica-admin/equipe` |
| `PATCH` | `/clinica-admin/equipe/{idAdmin}` |
| `GET` | `/clinica-admin/cargos` |
| `POST` | `/clinica-admin/cargos` |
| `PUT` | `/clinica-admin/cargos/{idCargo}` |

## Clínicas globais e vínculo de clínica
| Método | Endpoint |
|---|---|
| `POST` | `/admin-global/clinicas` |
| `POST` | `/vinculos-clinica/validar-codigo` |
| `POST` | `/vinculos-clinica/trocar` |
| `GET` | `/vinculos-clinica/me` |
| `GET` | `/vinculos-clinica/clinicas` |
| `POST` | `/vinculos-clinica/clinicas/{idClinica}/codigo` |
| `DELETE` | `/vinculos-clinica/clinicas/{idClinica}/codigo` |
| `PATCH` | `/vinculos-clinica/clinicas/{idClinica}/contrato` |

## Eventos
| Método | Endpoint |
|---|---|
| `POST` | `/eventos` |
| `POST` | `/eventos/estetica` |
| `GET` | `/eventos` |
| `GET` | `/eventos/{id}` |
| `GET` | `/eventos/{id}/detalhes` |
| `GET` | `/eventos/{id}/historico` |
| `PATCH` | `/eventos/{id}/reagendar` |
| `POST` | `/eventos/{id}/anexos` |
| `GET` | `/eventos/{id}/anexos` |
| `GET` | `/eventos/{id}/anexos/{idAnexo}` |
| `DELETE` | `/eventos/{id}/anexos/{idAnexo}` |
| `PATCH` | `/eventos/{id}/concluir` |
| `PATCH` | `/eventos/{id}/cancelar` |
| `DELETE` | `/eventos/{id}` |
| `GET` | `/eventos/pet/{idPet}/gasto-total` |
| `GET` | `/eventos/pet/{idPet}/alertas` |
| `PATCH` | `/eventos/{id}/confirmar` |
| `PATCH` | `/eventos/{id}/recusar` |

## Mensagens e notificações
| Método | Endpoint |
|---|---|
| `GET` | `/mensagens-clinica/conversas` |
| `POST` | `/mensagens-clinica/conversas` |
| `GET` | `/mensagens-clinica/conversas/{id}/mensagens` |
| `POST` | `/mensagens-clinica/conversas/{id}/mensagens` |
| `POST` | `/notificacoes/dispositivos` |
| `DELETE` | `/notificacoes/dispositivos/{token}` |
| `GET` | `/notificacoes` |
| `PATCH` | `/notificacoes/{id}/lida` |
| `PATCH` | `/notificacoes/lidas` |
| `GET` | `/usuarios/preferencias/notificacoes` |
| `PUT` | `/usuarios/preferencias/notificacoes` |

## Pets, responsáveis e atividades
| Método | Endpoint |
|---|---|
| `GET` | `/pets/racas` |
| `POST` | `/pets` |
| `GET` | `/pets` |
| `GET` | `/pets/{id}` (somente IDs numéricos) |
| `GET` | `/pets/buscar` |
| `GET` | `/pets/tutor/{idTutor}` |
| `PUT` | `/pets/{id}` (somente IDs numéricos) |
| `PUT` | `/pets/{id}/foto` (somente IDs numéricos; multipart) |
| `DELETE` | `/pets/{id}/foto` (somente IDs numéricos) |
| `GET` | `/pets/{id}/foto` (somente IDs numéricos) |
| `DELETE` | `/pets/{id}` (somente IDs numéricos) |
| `GET` | `/pets/{idPet}/atividades` |
| `POST` | `/responsaveis/convites` |
| `GET` | `/responsaveis` |
| `DELETE` | `/responsaveis/{idResponsavel}` |
| `POST` | `/pets/{idPet}/convites` |
| `GET` | `/auth/convites/{token}` |
| `POST` | `/auth/registrar-convite` |
| `GET` | `/pets/{idPet}/acessos` |
| `DELETE` | `/pets/{idPet}/acessos/{idAcesso}` |
| `PATCH` | `/pets/{idPet}/acessos/{idAcesso}` |
| `GET` | `/pets/{idPet}/convites` |
| `POST` | `/convites/{token}/aceitar` |
| `DELETE` | `/pets/{idPet}/convites/{idConvite}` |

## Saúde, medicamentos e prontuário
| Método | Endpoint |
|---|---|
| `GET` | `/pets/{id}/proximas-acoes` |
| `POST` | `/pets/tipos-vacina` |
| `GET` | `/pets/{id}/carteira-vacinacao` |
| `POST` | `/pets/{id}/carteira-vacinacao` |
| `GET` | `/pets/{id}/perfil-saude` |
| `PUT` | `/pets/{id}/perfil-saude` |
| `POST` | `/pets/{id}/peso` |
| `GET` | `/pets/{id}/peso/historico` |
| `GET` | `/pets/{idPet}/prontuario` |
| `GET` | `/pets/{idPet}/prontuario/exportar` |
| `POST` | `/pets/{idPet}/prontuario/compartilhamentos` |
| `GET` | `/pets/{idPet}/prontuario/compartilhamentos` |
| `DELETE` | `/pets/{idPet}/prontuario/compartilhamentos/{idCompartilhamento}` |
| `POST` | `/pets/{idPet}/exames` |
| `POST` | `/pets/{idPet}/exames/{idExame}/arquivo` |
| `GET` | `/pets/{idPet}/exames` |
| `GET` | `/pets/{idPet}/exames/{idExame}/arquivo` |
| `DELETE` | `/pets/{idPet}/exames/{idExame}` |
| `POST` | `/eventos/{idEvento}/orientacoes` |
| `GET` | `/eventos/{idEvento}/orientacoes` |
| `DELETE` | `/eventos/{idEvento}/orientacoes/{idOrientacao}` |
| `GET` | `/prontuarios-publicos/{token}` |
| `GET` | `/prontuarios-publicos/{token}/dados` |
| `GET` | `/prontuarios-publicos/{token}/exames/{idExame}/arquivo` |
| `POST` | `/medicamentos` |
| `GET` | `/medicamentos` |
| `GET` | `/medicamentos/{id}` |
| `PUT` | `/medicamentos/{id}` |
| `DELETE` | `/medicamentos/{id}` |
| `POST` | `/prescricoes` (multipart) |
| `GET` | `/prescricoes` |
| `GET` | `/prescricoes/{id}` |
| `PATCH` | `/prescricoes/{id}/liberar` |
| `POST` | `/planos` |
| `GET` | `/planos` |
| `GET` | `/planos/{id}` |
| `PATCH` | `/planos/itens/{idItem}/agendar` |

## Pontos e recompensas
| Método | Endpoint |
|---|---|
| `GET` | `/pontos` |
| `GET` | `/pontos/saldos` |
| `PATCH` | `/pontos/{id}/liberar` |
| `PATCH` | `/pontos/{id}/bloquear` |
| `PATCH` | `/pontos/{id}/desbloquear` |
| `GET` | `/recompensas` |
| `GET` | `/recompensas/todas` |
| `GET` | `/recompensas/{id}` |
| `POST` | `/recompensas` (multipart) |
| `PUT` | `/recompensas/{id}` (multipart) |
| `DELETE` | `/recompensas/{id}` |
| `GET` | `/recompensas/{id}/imagem` |
| `GET` | `/recompensas/saldo` |
| `PATCH` | `/recompensas/{id}/resgatar` |
| `GET` | `/recompensas/resgates` |
| `PATCH` | `/recompensas/resgates/{idResgate}/validar` |

## Relatórios e estética
| Método | Endpoint |
|---|---|
| `GET` | `/veterinarios/me/relatorios/resumo` |
| `POST` | `/relatorios-estetica` |
| `GET` | `/relatorios-estetica` |
| `GET` | `/relatorios-estetica/{id}` |
| `PATCH` | `/relatorios-estetica/{id}/liberar` |
| `GET` | `/servicos-estetica` |
| `GET` | `/servicos-estetica/base` |
| `GET` | `/servicos-estetica/extras` |
| `GET` | `/profissionais-estetica` |
| `GET` | `/profissionais-estetica/disponiveis` |
| `GET` | `/profissionais-estetica/{id}` |
| `POST` | `/profissionais-estetica` |
| `PUT` | `/profissionais-estetica/{id}` |
| `PUT` | `/profissionais-estetica/{id}/servicos` |
| `GET` | `/profissionais-estetica/{id}/disponibilidade` |
| `POST` | `/profissionais-estetica/{id}/disponibilidade` |
| `DELETE` | `/profissionais-estetica/{id}/disponibilidade/{idDisponibilidade}` |
| `GET` | `/profissionais-estetica/{id}/bloqueios` |
| `POST` | `/profissionais-estetica/{id}/bloqueios` |
| `DELETE` | `/profissionais-estetica/{id}/bloqueios/{idBloqueio}` |

## Tutores e veterinários
| Método | Endpoint |
|---|---|
| `GET` | `/tutores/{id}` |
| `GET` | `/tutores` |
| `PUT` | `/tutores/{id}` |
| `DELETE` | `/tutores/{id}` |
| `GET` | `/veterinarios` |
| `GET` | `/veterinarios/{id}` |
| `POST` | `/veterinarios` |
| `PUT` | `/veterinarios/{id}` |
| `GET` | `/veterinarios/{id}/disponibilidade` |
| `POST` | `/veterinarios/{id}/disponibilidade` |
| `DELETE` | `/veterinarios/{id}/disponibilidade/{idDisponibilidade}` |
| `GET` | `/veterinarios/{id}/bloqueios` |
| `POST` | `/veterinarios/{id}/bloqueios` |
| `DELETE` | `/veterinarios/{id}/bloqueios/{idBloqueio}` |
| `GET` | `/tipos-evento` |

## Observações
- Os caminhos foram consolidados a partir da lista de mapeamentos fornecida.
- Parâmetros de rota como `{id}`, `{idPet}` e `{token}` representam valores variáveis.
- Endpoints que aceitam upload foram identificados como `multipart` quando isso constava explicitamente na lista.
- Há rotas com o mesmo caminho-base e métodos distintos; elas foram mantidas separadas.
