# Deploy no Laravel Cloud (plano Sandbox)

Passo a passo do primeiro deploy. Tudo que exige login/conta e feito por voce
no painel — este arquivo so registra as escolhas certas para este projeto.

## 1. Criar o projeto

1. Acesse https://cloud.laravel.com e crie a conta.
2. Conecte a conta do GitHub e selecione o repositorio do ConectaEBD.
3. Branch de deploy: `main`.
4. Plano: **Sandbox**.

## 2. Banco de dados

Escolha **MySQL** (o Sandbox permite ate 5 GB).

Nao use Postgres neste projeto: as migrations usam `enum()` e `->after()`, que
se comportam de forma diferente no Postgres. MySQL mantem paridade com o
`docker-compose.yml` usado no desenvolvimento.

Ao anexar o banco, o Laravel Cloud injeta `DB_CONNECTION`, `DB_HOST`, `DB_PORT`,
`DB_DATABASE`, `DB_USERNAME` e `DB_PASSWORD` sozinho. Nao defina essas variaveis
na mao.

## 3. Variaveis de ambiente

No painel, aba Environment:

```
APP_NAME=ConectaEBD
APP_ENV=production
APP_DEBUG=false

APP_LOCALE=pt_BR
APP_FALLBACK_LOCALE=pt_BR
APP_FAKER_LOCALE=pt_BR

LOG_CHANNEL=stack
LOG_LEVEL=error

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database

VITE_APP_NAME="${APP_NAME}"
```

`APP_KEY` e `APP_URL` sao preenchidos pelo Laravel Cloud. Confira depois do
primeiro deploy se `APP_URL` bate com o dominio final.

## 4. Comandos de build e deploy

Build:

```
composer install --no-dev --optimize-autoloader
npm ci && npm run build
```

Deploy:

```
php artisan migrate --force
php artisan optimize
```

`php artisan optimize` e seguro aqui: nao existe nenhuma chamada a `env()` fora
de `config/` neste projeto, entao o cache de config nao perde valores.

## 5. Health check

A rota `/up` ja existe (`bootstrap/app.php`). Aponte o health check para ela.

## 6. Dominio proprio

O Sandbox aceita dominio customizado. Depois do primeiro deploy:

1. No painel, adicione o dominio e copie o alvo do CNAME.
2. No DNS, crie `CNAME www -> <alvo>`.
3. Para o dominio raiz, use a Cloudflare como DNS (CNAME flattening) — o painel
   do Registro.br nao tem ALIAS/ANAME.
4. Se usar proxy da Cloudflare, o SSL precisa estar em **Full (strict)**.
5. Escolha www OU raiz e redirecione o outro com 301, para nao dividir o cookie
   de sessao entre dois hostnames.

## 7. Hibernacao

No Sandbox o app hiberna quando ocioso. O primeiro acesso depois de um periodo
parado demora alguns segundos. Para EBD (uso concentrado no domingo) isso e
aceitavel; se incomodar, o plano pago remove a hibernacao.
