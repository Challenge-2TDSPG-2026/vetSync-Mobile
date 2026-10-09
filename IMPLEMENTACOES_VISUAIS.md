# Implementações visuais do VetSync

## Implementações concluídas

- [x] Dashboard do tutor com card **Resumo da semana**
  - Percentual de cuidados concluídos.
  - Barra de progresso.
  - Indicadores de cuidados concluídos, pendentes e atrasados.
  - Cálculo baseado nos eventos já carregados.
  - Compatibilidade com tema claro, tema escuro e modo simples.

- [x] Agenda do tutor com timeline visual
  - Marcadores coloridos por tipo de evento.
  - Linha de conexão entre os eventos do dia.
  - Cards e ações existentes preservados.
  - Filtros, calendário, cancelamento e remoção mantidos.

- [x] Carteira de vacinação com status de proteção
  - Card **Proteção em dia**.
  - Percentual de cobertura vacinal.
  - Barra de progresso.
  - Alerta para vacinas atrasadas.
  - Fallback para eventos locais quando o resumo remoto não está disponível.

- [x] Catálogo de recompensas com custo visual
  - Custo em formato de pill.
  - Ícone de pontos.
  - Estado bloqueado para pontos insuficientes.
  - Indicação de quantos pontos ainda faltam.
  - Fluxo de resgate preservado.

## Próximas implementações

- [x] Padronizar estados de carregamento e estados vazios
  - Unificar skeletons, ilustrações, mensagens e ações.
  - Revisar telas do tutor e do veterinário.
  - Preservar acessibilidade e modo simples.
  - Skeletons pulsantes e `EmptyState` foram mantidos como base compartilhada.

- [x] Adicionar microinterações
  - Animação de entrada dos cards.
  - Feedback ao trocar de pet.
  - Feedback ao concluir eventos.
  - Animação ao resgatar recompensas.
  - Shimmer nos skeletons, se compatível com o padrão atual.
  - Adicionado `AnimatedPressable` para feedback de pressão em ações rápidas do veterinário.

- [x] Melhorar a ficha do pet
  - Header com foto, nome, espécie e raça.
  - Indicadores de peso e última consulta.
  - Gráfico ou visualização da evolução do peso.
  - Timeline clínica.
  - Alertas importantes.
  - Ação para agendar atendimento.
  - Adicionado resumo de saúde com peso, alergias e medicamentos.
  - Histórico clínico organizado em timeline.

- [x] Evoluir o dashboard do veterinário
  - Cards de métricas principais.
  - Agenda do dia em timeline.
  - Identificação visual dos pacientes.
  - Indicador de ocupação da agenda.
  - Alertas de consultas atrasadas.
  - Destaque para resgates pendentes.
  - Adicionado indicador de ocupação da agenda do dia.

- [x] Criar ou aprimorar tokens do design system
  - Escala de espaçamento.
  - Raios de borda.
  - Sombras e elevação.
  - Tipografia.
  - Tamanhos padronizados de ícones.
  - Reutilização gradual nas telas existentes.
  - Adicionado `DESIGN_TOKENS` com espaçamento, raios, elevação e tamanhos de ícone.

## Ordem sugerida

Todas as cinco frentes acima foram implementadas neste lote.

## Observações de validação

- Os arquivos alterados foram validados com ESLint individualmente.
- `git diff --check` foi executado sem problemas.
- O `typecheck` completo permanece bloqueado por um problema preexistente em `utils/__tests__/planoLembreteService.test.ts`, que importa o módulo ausente `../planoLembreteService`.
