# CI/CD Android — GitHub Actions e Firebase App Distribution

Este fluxo compila o APK com Expo Application Services (EAS) e o distribui no
Firebase App Distribution. Ele não publica na Google Play Store.

## Arquitetura

O projeto usa Expo SDK 57 no fluxo gerenciado. Não há diretório `android/` ou
Gradle versionado: o EAS executa a compilação Android na nuvem. O perfil
`preview` já gera APK interno, usa `appVersionSource: remote` e incrementa o
`versionCode` automaticamente.

O workflow `.github/workflows/firebase-distribution.yml` executa estas etapas:

1. Instala as dependências Node.js 22 a partir do `package-lock.json`.
2. Executa `npm run check` e `npm test`.
3. Determina a versão, gera notas com os cinco commits recentes e valida o SHA
   completo do commit.
4. Solicita o APK ao EAS usando o perfil `preview`.
5. Baixa o APK concluído e publica-o como artefato desta execução por 30 dias.
6. Autentica no Firebase com Application Default Credentials e distribui o APK
   para o grupo configurado.
7. Registra versão, commit, referência e resultado no resumo da execução.

O grupo de concorrência permite uma execução deste workflow por vez. O EAS
mantém a fonte remota do `versionCode`, evitando colisões causadas por builds
simultâneos. O nome da versão Android é fornecido pelo workflow ao
`app.config.js`; o valor padrão do app continua sendo o de `app.json` fora do CI.

## Gatilhos e versões

| Evento | Comportamento |
| --- | --- |
| Push em `develop` | Gera `0.1.0-dev.<execução>.<tentativa>` e distribui ao grupo interno. |
| Tag `vX.Y.Z` | Gera a versão estável indicada pela tag e distribui ao grupo configurado. |
| Execução manual em `develop` | Gera uma versão de desenvolvimento como no push. |
| Execução manual em `main` | Exige `version_name` (por exemplo, `0.1.1`) e distribui essa versão estável. |

Uma tag estável deve usar o formato `vX.Y.Z`, como `v0.1.1`, e apontar para o
commit que se deseja publicar. A branch `main` não dispara distribuição por
push. O workflow manual só aceita `main` e `develop`.

O `versionCode` não vem do número de execuções do GitHub Actions. Ele é gerido
remotamente pelo EAS, cuja configuração já define `appVersionSource: remote` e
`autoIncrement: true` no perfil usado para APK. O valor local atual é `3`, que
corresponde à build distribuída documentada no repositório. Antes da primeira
execução, confira no projeto EAS se a versão remota do Android está sincronizada
com o último `versionCode` distribuído. Se ainda não estiver inicializada,
inicialize-a com o último número distribuído (`3`) usando `eas build:version:set`
antes de iniciar o workflow; a próxima build automática deve receber o número
seguinte. Não inicialize a versão remota de novo depois de builds automáticas.

## Configuração no GitHub

Cadastre os valores em **Settings → Secrets and variables → Actions** do
repositório.

### Secrets

| Nome | Finalidade | Como obter |
| --- | --- | --- |
| `EXPO_TOKEN` (obrigatório) | Autoriza a CLI a criar e consultar builds EAS do projeto já associado pelo `projectId` em `app.json`. | Crie um access token na conta Expo que tem acesso ao projeto VetSync. Cadastre-o como secret, nunca como variável comum. |
| `FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_JSON` (alternativa) | Chave JSON para autenticar o Firebase CLI via Application Default Credentials, usada somente se WIF não estiver configurado. | Crie uma conta de serviço dedicada no projeto Google Cloud `vetsync-76c0e`, atribua o papel **Firebase App Distribution Admin**, gere a chave JSON e salve o conteúdo integral como secret. Restrinja o acesso ao secret e rotacione a chave conforme a política da equipe. |

A pipeline prefere Workload Identity Federation (OIDC), que fornece credenciais
temporárias ao runner. Se o WIF não estiver configurado, aceita o secret de
chave JSON como alternativa e grava-o em arquivo temporário com permissão
restrita antes de definir `GOOGLE_APPLICATION_CREDENTIALS`. Esse arquivo não é
adicionado ao repositório nem ao artefato APK. A chave de conta de serviço é
uma credencial de longo prazo; não a coloque em `.env`, YAML, documentação ou
logs.

### Variables

| Nome | Finalidade | Como obter |
| --- | --- | --- |
| `FIREBASE_APP_DISTRIBUTION_GROUPS` | Alias do grupo (ou aliases separados por vírgula) que receberá as builds. | Crie ou consulte o grupo em Firebase Console → App Distribution → Testers & Groups. Use o alias existente, sem inventar um novo. |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` (opcional, recomendado) | Identificador completo do provider WIF para autenticação OIDC. | Configure um Workload Identity Pool/Provider no Google Cloud para confiar neste repositório GitHub e copie o nome completo `projects/.../locations/global/workloadIdentityPools/.../providers/...`. Restrinja as condições do provider ao repositório e às refs `main`, `develop` e tags `v*`. |
| `GCP_SERVICE_ACCOUNT_EMAIL` (opcional, recomendado) | Conta de serviço que o workflow assume por WIF. | Use uma conta dedicada do projeto `vetsync-76c0e` com o papel **Firebase App Distribution Admin**. Conceda à identidade federada desse repositório a permissão de impersonar essa conta (`roles/iam.workloadIdentityUser`). |

`FIREBASE_APP_DISTRIBUTION_GROUPS` é obrigatória. Os dois valores WIF são
opcionais, mas devem ser configurados em conjunto para usar OIDC.

Configure `GCP_WORKLOAD_IDENTITY_PROVIDER` e `GCP_SERVICE_ACCOUNT_EMAIL` em
conjunto. Quando ambos estiverem preenchidos, o workflow usa WIF e ignora a
chave JSON. Se ambos estiverem vazios, a alternativa por chave JSON exige
`FIREBASE_APP_DISTRIBUTION_SERVICE_ACCOUNT_JSON`.

O Firebase Android App ID usado pelo workflow é o que já está no
`google-services.json`: `1:376247909118:android:334d8f77fb63b6d07903af`. O
projeto Firebase configurado é `vetsync-76c0e`.

## Assinatura e compatibilidade de instalação

Não há keystore no repositório, e o workflow não cria nem substitui um. A
assinatura do APK fica sob responsabilidade das credenciais Android armazenadas
no projeto EAS.

Antes da primeira distribuição, confirme que o keystore selecionado no EAS é o
mesmo que assinou o APK atualmente instalado pelos testadores. Consulte as
credenciais Android do projeto com `eas credentials --platform android` e
compare a impressão digital SHA-1/SHA-256 com a do APK atualmente distribuído.
Se o keystore original estiver fora do EAS, importe o keystore existente para o
EAS antes de executar o workflow. Não gere outro keystore para substituir o
original. Se a assinatura não corresponder, o Android não atualizará a
instalação existente. A distribuição real só deve ser considerada validada
depois de instalar o APK gerado por cima de uma instalação de teste existente.

O `applicationId` permanece `com.vetsync.app`. As versões `develop` e estável
usam o mesmo app Android cadastrado no Firebase e não podem ficar instaladas
lado a lado: instalar uma atualização substitui a outra, desde que a assinatura
seja compatível. O sufixo `-dev` no `versionName`, as notas e o grupo de
testadores identificam a build de desenvolvimento. Para instalações paralelas
ou backend separado, será necessário planejar um `applicationId` e um app
Firebase distintos antes de mudar a configuração.

## Primeiro uso

1. Confirme que o projeto EAS `65c847ac-eddf-4dc7-9be0-446b1105c4c1` está
   acessível ao token Expo e que o `versionCode` remoto está sincronizado com a
   build distribuída `3`.
2. Confirme no EAS que as credenciais Android preservam a assinatura do APK já
   distribuído.
3. Crie o grupo de testadores no Firebase e cadastre `EXPO_TOKEN`,
   `FIREBASE_APP_DISTRIBUTION_GROUPS` e uma das formas de autenticação Firebase:
   WIF (recomendado) ou o secret da chave de serviço.
4. Adicione a branch `develop` ao repositório, se ainda não existir, e faça push
   nela para iniciar uma build interna. O checkout analisado contém `main`, mas
   ainda não contém a branch `develop`.
5. Acompanhe **Actions → Android Firebase App Distribution**. A execução mostra
   o build, a distribuição, o resultado e o APK para download em **Artifacts**.
6. Para uma versão estável, crie e envie uma tag `vX.Y.Z` ou execute o workflow
   manualmente na `main` informando `version_name`.

## Executar manualmente

Em GitHub, abra **Actions → Android Firebase App Distribution → Run workflow**.
Selecione `develop` para uma build de desenvolvimento. Selecione `main` e
informe `version_name` no formato `X.Y.Z` para uma distribuição estável manual.

## Diagnóstico

- **EAS não autorizado:** confira `EXPO_TOKEN`, o acesso à organização/projeto
  Expo e o `projectId` de `app.json`.
- **Build EAS sem credenciais Android:** configure no projeto EAS o keystore
  original antes do workflow. Não aceite criar uma nova chave sem confirmar que
  a compatibilidade de assinatura foi preservada.
- **`versionCode` duplicado ou baixo:** confira a versão remota EAS e sincronize
  uma única vez com o último número distribuído antes de builds futuras.
- **Firebase sem autenticação:** confira a configuração WIF ou se o JSON do
  secret é válido; a conta usada deve pertencer ao projeto `vetsync-76c0e` e ter
  o papel App Distribution Admin.
- **Grupo não encontrado:** confira o alias exato cadastrado no Firebase e a
  variável `FIREBASE_APP_DISTRIBUTION_GROUPS`.
- **APK não instala como atualização:** compare a assinatura do APK com a
  instalação existente e restaure no EAS o keystore original. O `applicationId`
  também precisa continuar como `com.vetsync.app`.
- **Build ou testes falham:** abra os logs da etapa correspondente no GitHub
  Actions. O workflow só distribui depois de `npm run check`, `npm test` e da
  compilação EAS concluírem sem erro.

## Limites da validação local

O workflow e esta documentação preparam a automação. Uma execução EAS e um
upload ao Firebase exigem os Secrets, a Variable, a configuração de assinatura
e o grupo de testadores no ambiente externo. Até uma execução real terminar com
sucesso e o APK ser instalado em um dispositivo de teste, a distribuição e a
compatibilidade de assinatura permanecem pendentes de validação.
