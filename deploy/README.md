# Deploy do ConectaEBD na Oracle Cloud (Always Free)

Guia completo, do zero ao site no ar. As etapas 1 a 4 sao no navegador
(so voce pode fazer). A etapa 6 e um script que faz o resto sozinho.

Stack final: Ubuntu 24.04 ARM + nginx + PHP 8.3-FPM + MySQL 8 + Node 22.

---

## 1. Criar a conta Oracle Cloud

Acesse <https://www.oracle.com/cloud/free/> e clique em "Start for free".

**O que voce precisa ter em maos:**

- Um e-mail que ainda nao tenha sido usado em outra conta Oracle
- Um celular para receber o SMS de verificacao
- **Um cartao de credito** (nao e cobrado; a Oracle faz uma pre-autorizacao
  de cerca de US$ 1 que e estornada em alguns dias)

**Pontos de atencao no cadastro:**

| Campo | O que fazer |
|---|---|
| Account Type | `Individual` (pessoa fisica) |
| Nome | Exatamente igual ao do cartao, senao a verificacao falha |
| **Home Region** | **Nao da para mudar depois.** `Brazil East (Sao Paulo)` da a menor latencia. |
| Cartao | Precisa ser **credito**. Debito e cartao virtual sao recusados com frequencia. |

Se o cartao for recusado sem motivo aparente, o mais comum e o banco
bloqueando a cobranca internacional de US$ 1 — libere no app do banco e
tente de novo.

**Sobre a cobranca:** a conta comeca com 30 dias de trial e US$ 300 em
creditos. Quando o trial acaba, ela vira Always Free automaticamente e os
recursos que cabem na cota gratuita **continuam rodando de graca, sem
prazo**. A VM deste guia cabe na cota. Voce nao e cobrado a menos que faca
upgrade explicito para Pay As You Go.

---

## 2. Criar a VM

No console: **Menu ☰ → Compute → Instances → Create Instance**.

| Campo | Valor |
|---|---|
| Name | `conectaebd` |
| Image | **Canonical Ubuntu 24.04** |
| Shape | **Ampere → VM.Standard.A1.Flex** |
| OCPUs / RAM | `4` OCPU e `24` GB (o teto da cota gratuita) |
| Boot volume | 50 GB ja basta |
| SSH keys | **Upload public key** (veja abaixo) |

Confirme que aparece o selo **"Always Free eligible"** na shape antes de criar.

**Gerar a chave SSH** (PowerShell no seu Windows):

```bash
ssh-keygen -t ed25519 -C "conectaebd"
```

Aceite o caminho padrao. Faca upload do arquivo **`.pub`**
(`%USERPROFILE%\.ssh\id_ed25519.pub`) — nunca o outro.

### Se aparecer "Out of host capacity"

E o erro mais comum do tier gratuito: as maquinas ARM sao concorridas.
O que fazer, em ordem:

1. Trocar o **Availability Domain** (AD-1, AD-2, AD-3) e tentar de novo
2. Tentar em outro horario — de madrugada libera mais
3. Reduzir para 2 OCPU / 12 GB, que ainda sobra para este projeto

---

## 3. Reservar o IP e abrir as portas

**Reservar o IP** — por padrao o IP publico e efemero e muda se a VM
reiniciar, o que quebraria seu DNS.
Na instancia: **Resources → Attached VNICs → clique na VNIC → IPv4
Addresses → Edit → Public IP: Reserved IP → Create new**.

**Abrir as portas 80 e 443** — na instancia: **Subnet → Security Lists →
Default Security List → Add Ingress Rules**, e crie duas regras:

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

> A imagem Ubuntu da Oracle **tambem** tem um firewall local (iptables) que
> bloqueia tudo. Abrir a Security List sozinha nao adianta — o
> `provision.sh` cuida da parte do iptables.

---

## 4. Apontar o DNS

No seu provedor de DNS, crie dois registros com o **IP reservado** da etapa 3:

```
A    @      <IP-DA-VM>
A    www    <IP-DA-VM>
```

Espere resolver antes de seguir (deve responder o IP da VM):

```bash
nslookup conectaebd.com.br
```

Faca isso **antes** da etapa 6 — o certificado SSL so e emitido se o
dominio ja apontar para o servidor.

---

## 5. Conectar na VM

```bash
ssh ubuntu@<IP-DA-VM>
```

---

## 6. Provisionar (roda uma vez)

Ja dentro da VM:

```bash
curl -fsSL https://raw.githubusercontent.com/Tuanno/CONECTAEBD/main/deploy/provision.sh -o provision.sh
```

```bash
sudo DOMAIN=conectaebd.com.br CERTBOT_EMAIL=seu-email@exemplo.com bash provision.sh
```

Troque o dominio pelo seu. O script instala tudo, cria o banco com senha
aleatoria, clona o projeto, gera o `.env`, roda as migrations, faz o build
do Vite, configura o nginx e emite o certificado SSL. Leva de 5 a 10 minutos.

**Anote a senha do banco** que aparece no resumo do final.

Ainda nao tem dominio? Rode sem as variaveis:

```bash
sudo bash provision.sh
```

O site sobe em HTTP pelo IP. Depois, com o DNS pronto, e so emitir o SSL:

```bash
sudo certbot --nginx -d conectaebd.com.br -d www.conectaebd.com.br --redirect
```

E ajustar no `/var/www/conectaebd/.env`: `APP_URL` para `https://...` e
`SESSION_SECURE_COOKIE=true`, seguido de `php artisan config:cache`.

---

## 7. Criar o primeiro usuario

```bash
cd /var/www/conectaebd && php artisan tinker
```

---

## Deploys seguintes

Depois de dar push no `main`, basta:

```bash
/var/www/conectaebd/deploy/deploy.sh
```

Ele coloca o site em manutencao, atualiza o codigo, reinstala dependencias,
refaz o build, roda migrations, recria os caches e volta ao ar. Se algum
passo falhar, o site sai da manutencao sozinho.

---

## Manutencao

**Backup do banco** (o unico dado que importa — o projeto nao guarda
arquivos enviados). Para agendar um dump diario as 3h:

```bash
sudo tee /etc/cron.daily/backup-conectaebd >/dev/null <<'CRON'
#!/bin/sh
mysqldump conectaebd | gzip > /home/ubuntu/backups/db-$(date +\%F).sql.gz
find /home/ubuntu/backups -name 'db-*.sql.gz' -mtime +14 -delete
CRON
sudo chmod +x /etc/cron.daily/backup-conectaebd
```

Crie a pasta antes: `mkdir -p /home/ubuntu/backups`. Vale a pena copiar
esses dumps para fora da VM de tempos em tempos.

**Renovacao do SSL** e automatica (timer do certbot). Para conferir:

```bash
sudo certbot renew --dry-run
```

**Logs:**

```bash
tail -f /var/www/conectaebd/storage/logs/laravel.log
```

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Problemas comuns

| Sintoma | Causa |
|---|---|
| Site nao abre, `ssh` funciona | Falta a regra de ingress (etapa 3) ou o iptables local |
| Pagina carrega sem estilo nenhum | `npm run build` nao rodou, ou falta o `trustProxies` |
| Login nao persiste | `SESSION_SECURE_COOKIE=true` sem HTTPS ativo |
| 500 apos alterar o `.env` | Falta `php artisan config:cache` |
| `502 Bad Gateway` | PHP-FPM caiu: `sudo systemctl status php8.3-fpm` |
| Certbot falha | DNS ainda nao propagou, ou porta 80 fechada |
