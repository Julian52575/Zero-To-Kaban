# deployment/

Kubernetes deployment for Zero To Kanban: a Helm chart, Argo CD Applications
that deploy it, and a Nix + `just` toolkit that runs everything on a local
rootless k3s node.

```
deployment/
├── flake.nix                 dev shell (k3s, kubectl, helm, argocd, just); auto-starts k3s
├── justfile                  bootstrap / refresh / teardown recipes
├── argocd/
│   ├── root-app.yaml         app-of-apps for the prod cluster (syncs prod-app.yaml)
│   └── environments/         one Argo CD Application per environment
└── helm/zero-to-kanban/      the app chart (auth, backend, frontend, RabbitMQ, 2x Postgres, Traefik routes)
```

## Local quick start

**Requirements:** Linux (WSL2 works) with Nix (flakes enabled), a systemd
user session with cgroup v2 delegation (`loginctl enable-linger $USER`), and
a larger default socket send buffer, set once per machine:

```bash
echo 'net.core.wmem_default = 4194304' | sudo tee /etc/sysctl.d/90-rootless-k3s.conf
sudo sysctl --system
```

Without it, rootless k3s can only partly apply NetworkPolicies, and pods
randomly can't reach each other. The shell prints a warning when the setting
is missing.

```bash
nix develop ./deployment   # enters the shell AND starts a rootless k3s node
just up-local              # installs Argo CD, deploys your local checkout
```

After a minute or two:

| What         | URL                          | Login                                                                                          |
|--------------|------------------------------|------------------------------------------------------------------------------------------------|
| App          | http://localhost:18080       | register an account in the app                                                                 |
| Argo CD      | https://localhost:18081      | `admin` / `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' \| base64 -d` |
| Alertmanager | http://localhost:18082       | none (only if monitoring is installed, see below)                                                  |
| Traefik metrics | http://localhost:18080/metrics | `metrics` / `dev-only-change-me`                                                            |

The k3s node stops when the shell that started it exits. Other shells
opened in `deployment/` reuse the running node.

### `up-local` vs `up-gitops`

| Recipe           | Argo CD syncs from                           | To ship a change                  | Force a sync          |
|------------------|----------------------------------------------|-----------------------------------|-----------------------|
| `just up-local`  | your local repo, current branch (`file://`)  | `git commit` (no push needed)     | `just refresh-local`  |
| `just up-gitops` | GitHub, `main`                               | `git commit && git push` to main  | `just refresh-gitops` |

Argo CD always deploys a commit. Uncommitted changes are never deployed.
Use one mode at a time: both deploy to the `ztk-dev-k3s` namespace and serve
the same routes. Run `just rm` before switching modes.

### Optional: monitoring (Prometheus + Alertmanager)

```bash
kubectl apply -n argocd -f argocd/environments/monitoring-k3s-app.yaml
just up-local              # re-run to bind Alertmanager to localhost:18082
```

It has no alert rules and no notification receiver yet, and it keeps no data
across restarts.

### All recipes

| Recipe                         | Does                                                                   |
|--------------------------------|------------------------------------------------------------------------|
| `just`                         | list recipes                                                           |
| `just up-local` / `up-gitops`  | install Argo CD (version pinned by `argocd_version` in the `justfile`) if missing, apply the Application, bind the local ports (safe to re-run) |
| `just refresh-local` / `refresh-gitops` | make Argo CD re-read the repo now instead of on its next poll |
| `just rm`                      | delete the Argo CD Applications, everything they deployed, and Argo CD itself. Database volumes and the k3s node are kept. |
| `just down`                    | stop k3s and the port-forwards. Data on disk is kept.                  |
| `just nuke`                    | stop k3s and delete all its data (Argo CD, databases, everything)      |

To restart after `just down`, run `nix develop ./deployment` then `just up-local`.

### Shell settings

Set these before running `nix develop`:

| Variable           | Default                             | Effect                                             |
|--------------------|-------------------------------------|----------------------------------------------------|
| `K3S_NO_AUTOSTART` | unset                               | `1` = don't start k3s; print the command instead   |
| `ZTK_STATE_DIR`    | `$XDG_STATE_HOME/zero-to-kanban-k3s` (`~/.local/state/...`) | k3s data, kubeconfig and logs. Must be outside `deployment/`. |

The shell exports `KUBECONFIG` (pointing into the state dir) and `GIT_BRANCH`
(the branch `just up-local` deploys).

### Logs and troubleshooting

| Problem                             | Look at                                                        |
|-------------------------------------|----------------------------------------------------------------|
| k3s won't start or became unready   | `$ZTK_STATE_DIR/.k3s/k3s.log`                                  |
| `delegated cgroup v2 controllers are required` | systemd user session / linger is not set up (see the comments in `flake.nix`) |
| pods can't reach each other, k3s.log shows `Aborting sync ... Message too long` | `net.core.wmem_default` is too low, see Requirements |
| a localhost port stopped responding | `$ZTK_STATE_DIR/<name>-portforward.log`, then re-run `just up-local` |
| app pods not coming up              | `kubectl -n ztk-dev-k3s get pods`, or the Argo CD UI           |

## The Helm chart

`helm/zero-to-kanban` deploys:

| Component  | Image                                        | Port | Database                        |
|------------|----------------------------------------------|------|---------------------------------|
| `auth`     | `ghcr.io/julian52575/zero-to-kanban-auth`     | 4000 | `authdb` (its own Postgres)     |
| `backend`  | `ghcr.io/julian52575/zero-to-kanban-backend`  | 3000 | `postgresql`                    |
| `frontend` | `ghcr.io/julian52575/zero-to-kanban-frontend` | 3000 | none                               |
| `rabbitmq` | `docker.io/library/rabbitmq:4-management`     | 5672, 15672 (UI) | none              |

Both Postgres instances come from the Bitnami `postgresql` chart. Services
run their own migrations on startup. RabbitMQ carries the backend's domain
events. It is a single-node StatefulSet using the same image as
`docker-compose.yml`, with its data on its own volume.

**Startup order:** each pod has a `wait-for-*` init container that holds it
until the Service it depends on accepts connections. A Service only routes
to ready pods, so this waits for the dependency's readiness probe to pass:

```
postgresql ──┬▶ backend ──▶ frontend
rabbitmq   ──┘
authdb     ────▶ auth
```

**Routing** is done by a Traefik `IngressRoute` that matches on path only,
with no hostname. It is the same routing as `docker-compose.yml`:

| Path                          | Goes to               | Protection                                   |
|-------------------------------|-----------------------|----------------------------------------------|
| `/auth*`, `/login`, `/register` | auth                | public                                       |
| `/metrics`                    | Traefik's own metrics | separate BasicAuth (`ingress.metrics.auth`)  |
| `/api*`                       | backend, `/api` removed from the path | login required (ForwardAuth to auth) |
| everything else               | frontend              | login required                               |

On protected routes, client-sent `X-Auth-User-*` headers are removed. The
auth service then sets them after it checks the session.

**Network policies** make Traefik the only way in: auth, backend and
frontend accept traffic only from the Traefik pods, `postgresql` and
`rabbitmq` (AMQP port only) only from backend, and `authdb` only from auth.
The one exception is frontend → backend, for the startup wait. Kubelet probes, `kubectl exec` and
`kubectl port-forward` still work. If Traefik runs somewhere other than
k3s's `kube-system`, set `networkPolicy.ingressController`.

**Container hardening:** every app container, init containers included,
runs as uid 1000 with a read-only root filesystem, no Linux capabilities,
no privilege escalation and the default seccomp profile. The images must
not need root or write to disk (see `securityContext` in `values.yaml`).
`rabbitmq` gets the same settings but runs as its image's uid 999, and
writes only to its volume.

**Dev credentials** are plaintext defaults in `values.yaml`, for disposable
clusters only:

| What                      | Value                                   |
|---------------------------|-----------------------------------------|
| `/metrics` BasicAuth      | `metrics` / `dev-only-change-me`, e.g. `curl -u metrics:dev-only-change-me http://localhost:18080/metrics` |
| app DB (`postgresql`)     | user `todo`, password `todo`, database `todo`; superuser `postgres` / `postgres` |
| auth DB (`authdb`)        | user `authuser`, password `authpass`, database `auth`; superuser `postgres` / `postgres` |
| session signing key       | `dev-only-change-me`                    |
| RabbitMQ                  | `user` / `dev-only-change-me`           |

The `/metrics` Secret stores only a bcrypt hash, so the password can't be
read back from the cluster. Get it from `values.yaml` in dev, or from
whoever created the Secret in prod.

**RabbitMQ management UI:** not routed by Traefik. Forward it, then open
http://localhost:15672:

```bash
kubectl -n ztk-dev-k3s port-forward svc/ztk-dev-k3s-local-zero-to-kanban-rabbitmq 15672
```

RabbitMQ, like Postgres, only takes its user and password when its volume
is first created.

**Database dumps:** run `pg_dump` inside the database pod as the `postgres`
superuser. No local Postgres client is needed:

```bash
kubectl -n ztk-dev-k3s exec ztk-dev-k3s-local-postgresql-0 -- \
  env PGPASSWORD=postgres pg_dump -h 127.0.0.1 -U postgres todo > todo.sql
kubectl -n ztk-dev-k3s exec ztk-dev-k3s-local-authdb-0 -- \
  env PGPASSWORD=postgres pg_dump -h 127.0.0.1 -U postgres auth > auth.sql
```

In prod, read the password from the `postgres-password` key of the
database's Secret. A database only takes its passwords when its volume is
first created. On an older dev volume, run `just nuke` to reset them.

**Values files:** `values.yaml` holds the defaults. `values-dev.yaml` or
`values-prod.yaml` is layered on top of it.

| Setting                | dev                                  | prod                                    |
|------------------------|--------------------------------------|-----------------------------------------|
| image tag / pull       | `manual-test`, `Always`              | release tag bumped on each release (`manual-test` until the first one), `IfNotPresent` |
| replicas (be/auth/fe)  | 1 / 1 / 1                            | 4 / 2 / 2                               |
| frontend memory limit  | 1Gi                                  | 128Mi                                   |
| secrets                | plaintext defaults in `values.yaml`  | pre-created Secrets (`existingSecret`)  |
| entrypoint / TLS       | `web`, no TLS                        | `websecure`, TLS from Secret `kanban-tls` |
| `/metrics` route       | on                                   | off                                     |
| DB volume sizes        | 1Gi / 1Gi                            | 10Gi / 5Gi                              |
| RabbitMQ volume size   | 1Gi                                  | 2Gi                                     |

Postgres images are pinned in `values.yaml` to `bitnamilegacy/postgresql`,
because Bitnami removed the versioned tags.

Render it without a cluster:

```bash
helm dependency build helm/zero-to-kanban
helm template ztk helm/zero-to-kanban -f helm/zero-to-kanban/values.yaml -f helm/zero-to-kanban/values-dev.yaml
```

## Argo CD Applications

| File (in `argocd/environments/`) | App name             | Namespace     | Source                      | Auto-sync | Applied by                   |
|----------------------------------|----------------------|---------------|-----------------------------|-----------|------------------------------|
| `dev-app.yaml`                   | `ztk-dev`            | `ztk-dev`     | GitHub `main`, dev values   | yes       | manual `kubectl apply`, never on the prod cluster |
| `prod-app.yaml`                  | `ztk-prod`           | `ztk-prod`    | GitHub `main`, prod values  | **no**    | `root-app.yaml`              |
| `dev-k3s-app.yaml`               | `ztk-dev-k3s`        | `ztk-dev-k3s` | GitHub `main`, dev values   | yes       | `just up-gitops`             |
| `dev-k3s-local-app.yaml`         | `ztk-dev-k3s-local`  | `ztk-dev-k3s` | local repo, current branch  | yes       | `just up-local` (template, don't apply directly) |
| `monitoring-k3s-app.yaml`        | `ztk-monitoring-k3s` | `monitoring`  | `prometheus` chart 29.33.0  | yes       | manual `kubectl apply`       |

## Shared / production cluster

1. Install Argo CD in the cluster, at the version the `justfile` pins
   (`argocd_version`). Until this is done, applying any Argo CD file fails
   with `no matches for kind "Application"`.

   ```bash
   kubectl create namespace argocd
   # --server-side: the ApplicationSet CRD is too big for client-side apply
   kubectl apply --server-side -n argocd \
     -f https://raw.githubusercontent.com/argoproj/argo-cd/v3.5.3/manifests/install.yaml
   kubectl -n argocd wait --for=condition=available --timeout=300s deployment/argocd-server
   ```

   The UI isn't public. See [Reaching the internal UIs](#reaching-the-internal-uis)
   below to open it.

2. Create the prod Secrets in `ztk-prod`, before the first sync.
   `values-prod.yaml` only names them, so Argo CD never sees the values.
   Sealed Secrets or the External Secrets Operator can create them instead
   of `kubectl`. Every password is generated with `openssl rand -hex`, so
   there is nothing to invent: the database and RabbitMQ passwords are put
   into connection URLs (`postgresql://user:password@host`) without escaping,
   and a `@`, `/` or `:` in them would break the connection.

   ```bash
   kubectl create namespace ztk-prod
   kubectl -n ztk-prod create secret generic zero-to-kanban-prod-auth \
     --from-literal=session-secret="$(openssl rand -hex 32)"
   kubectl -n ztk-prod create secret generic zero-to-kanban-prod-postgresql \
     --from-literal=password="$(openssl rand -hex 32)" \
     --from-literal=postgres-password="$(openssl rand -hex 32)"
   kubectl -n ztk-prod create secret generic zero-to-kanban-prod-authdb \
     --from-literal=password="$(openssl rand -hex 32)" \
     --from-literal=postgres-password="$(openssl rand -hex 32)"
   kubectl -n ztk-prod create secret generic zero-to-kanban-prod-rabbitmq \
     --from-literal=password="$(openssl rand -hex 32)"
   ```

   Each database Secret holds two passwords, one per Postgres account:

   | Key                 | Account                                   | Used by                  |
   |---------------------|-------------------------------------------|--------------------------|
   | `password`          | app user (`todo`, or `authuser` for authdb) | backend / auth, at runtime |
   | `postgres-password` | `postgres` superuser                      | you: `pg_dump`, admin    |

   No need to write them down. Read one back with:

   ```bash
   kubectl -n ztk-prod get secret zero-to-kanban-prod-postgresql \
     -o jsonpath='{.data.postgres-password}' | base64 -d; echo
   ```

   A database only takes its passwords when its volume is first created.
   Editing the Secret afterwards does not change them.

3. Create the TLS certificate, as a `kubernetes.io/tls` Secret named
   `kanban-tls` in `ztk-prod`. Pick one:

   - **With a domain name (recommended):** cert-manager gets a free Let's
     Encrypt certificate and renews it. Point the domain's DNS `A` record at
     the server, and make sure ports 80 and 443 are open, then:

     ```bash
     kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
     kubectl -n cert-manager rollout status deploy/cert-manager-webhook

     # replace the email and the domain
     kubectl apply -f - <<'EOF'
     apiVersion: cert-manager.io/v1
     kind: ClusterIssuer
     metadata:
       name: letsencrypt
     spec:
       acme:
         server: https://acme-v02.api.letsencrypt.org/directory
         email: you@example.com
         privateKeySecretRef:
           name: letsencrypt-account-key
         solvers:
           - http01:
               ingress:
                 ingressClassName: traefik
     ---
     apiVersion: cert-manager.io/v1
     kind: Certificate
     metadata:
       name: kanban-tls
       namespace: ztk-prod
     spec:
       secretName: kanban-tls
       dnsNames:
         - kanban.example.com
       issuerRef:
         name: letsencrypt
         kind: ClusterIssuer
     EOF

     kubectl -n ztk-prod get certificate kanban-tls   # wait for READY=True
     ```

     If it stays `False`, `kubectl -n ztk-prod describe certificate kanban-tls`
     says why (usually DNS not pointing at the server yet, or port 80 closed).

   - **Without a domain (IP only):** a self-signed certificate. HTTPS works,
     but browsers show a warning you have to click through.

     ```bash
     openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
       -subj "/CN=kanban" -keyout tls.key -out tls.crt
     kubectl -n ztk-prod create secret tls kanban-tls --cert=tls.crt --key=tls.key
     rm tls.key tls.crt
     ```

   - **You already have `tls.crt` / `tls.key`** (from your DNS or hosting
     provider): run only the `kubectl ... create secret tls` line above, from
     the directory holding them.

4. *(Optional)* `/metrics` is off in prod. To turn it on, set
   `ingress.metrics.enabled: true` and
   `ingress.metrics.auth.existingSecret: zero-to-kanban-prod-metrics-auth`,
   then create that Secret. It holds an htpasswd line under the key `users`.
   `htpasswd` comes from `apache2-utils` (`sudo apt install apache2-utils`):

   ```bash
   METRICS_PASSWORD="$(openssl rand -hex 16)"
   echo "metrics password: $METRICS_PASSWORD"   # save it, it can't be read back
   htpasswd -nbB metrics "$METRICS_PASSWORD" | kubectl -n ztk-prod create secret \
     generic zero-to-kanban-prod-metrics-auth --from-file=users=/dev/stdin
   ```

5. Apply the root app once. It then creates and manages `ztk-prod`. It
   never creates `ztk-dev`: dev runs on default credentials published in
   this repo, so it must not share a public cluster with prod.

   ```bash
   kubectl apply -n argocd -f argocd/root-app.yaml
   ```

   If an older root app already created `ztk-dev`, it deletes it on its
   next sync (`prune: true`).

6. **Release to prod:** each GitHub release publishes new images, then
   `.github/workflows/bump-helm-chart.yml` writes the release tag into
   `values-prod.yaml`, deploys the chart with the prod values into a
   throwaway k3s node, and opens a PR if it becomes ready. Merge the PR, then
   sync `ztk-prod` by hand from the Argo CD UI or with
   `argocd app sync ztk-prod`.

### Reaching the internal UIs

Only the app itself is public (Traefik on ports 80/443). Argo CD, the
RabbitMQ management UI and the databases are reachable only from inside the
cluster. Open them with `kubectl port-forward`, from any machine whose
`kubectl` can reach the cluster:

```bash
kubectl -n argocd port-forward svc/argocd-server 8081:443 &
kubectl -n ztk-prod port-forward svc/ztk-prod-zero-to-kanban-rabbitmq 15672:15672 &
kubectl -n ztk-prod port-forward svc/ztk-prod-postgresql 15432:5432 &
kubectl -n ztk-prod port-forward svc/ztk-prod-authdb 15433:5432 &
wait   # Ctrl+C stops them all
```

Start only the ones you need. The NetworkPolicies don't block
`kubectl port-forward`.

| What                  | Local port | URL / client                        | Login |
|-----------------------|------------|-------------------------------------|-------|
| Argo CD               | 8081       | https://localhost:8081 (self-signed, accept the warning) | `admin` / `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' \| base64 -d` |
| RabbitMQ management   | 15672      | http://localhost:15672              | `user` / `password` key of `zero-to-kanban-prod-rabbitmq` |
| app DB (`postgresql`) | 15432      | `psql -h localhost -p 15432 -U todo todo` | `password` key of `zero-to-kanban-prod-postgresql` |
| auth DB (`authdb`)    | 15433      | `psql -h localhost -p 15433 -U authuser auth` | `password` key of `zero-to-kanban-prod-authdb` |

The Secret keys are read back as in step 2, e.g.
`kubectl -n ztk-prod get secret zero-to-kanban-prod-rabbitmq -o jsonpath='{.data.password}' | base64 -d; echo`.
Use the `postgres` user and the `postgres-password` key for admin work.
