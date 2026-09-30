# Project Monitoring

- **Discussion:** [#131](https://github.com/Julian52575/Zero-To-Kanban/discussions/131)
- **Category:** Architecture Decision Records
- **Original poster:** @Julian52575
- **Opened:** 2026-09-23 07:31Z
- **Closed:** 2026-09-30 19:43Z

### Discussion

### Date

2026-09-23

### Context

A good DevOps flow must monitor the deployed application (see #123 and #126) to see and fix errors.

The app now runs on Kubernetes (Helm chart, Argo CD) in a local k3s dev cluster and a shared prod cluster. Today the only ways to see how it behaves are ad-hoc: `kubectl logs`, `kubectl top`, a port-forward. Nothing keeps history, and nothing tells us when the app starts failing.

### Interrogation

- Would that tool live inside the cluster ?
  → Yes. A `monitoring` namespace, reachable only through `kubectl port-forward` like Argo CD and the RabbitMQ UI. Nothing is added to the public Traefik routes.
- What metrics should be traced ?
  → At the edge (Traefik): request rate, 5xx ratio and latency. Per container (kubelet cAdvisor): memory against its limit, CPU. The backend, auth and frontend do not expose application metrics yet.
- 1 massive tool or multiple few ?
  → One small stack: Prometheus + Alertmanager from the upstream `prometheus` Helm chart. No Grafana, kube-state-metrics, node-exporter or pushgateway for now.

### Options

1. **Linux `watch`**: re-run a command (`kubectl get pods`, `kubectl top pods`, ...) every few seconds in a terminal. Nothing to install. It shows only what that command prints, only while someone is looking at it, on one machine. Nothing is stored and nothing alerts.
2. **Kubernetes built-in metrics (`kubectl top pods`)**: metrics-server, bundled with k3s. Nothing to install. It gives the current CPU and memory of pods and nodes. There is no history, no request-level data (rates, errors, latency) and no alerting.
3. **Traefik dashboard**: Traefik's own web UI. It lists the routers, services and middlewares and their state as configured now. It has no request rates, error ratios or history. It has to be reached through a route or a port-forward.
4. **Prometheus (with Alertmanager)**: scrapes metrics on a schedule, stores them as time series, evaluates alert rules and hands firing alerts to Alertmanager. Traefik and the kubelet already expose metrics for it, so the app needs no change. It has to be deployed, needs storage and needs a notification target to be useful outside its UI.

### Decision

Accepted

### Branch

158-feature-project-monitoring

### Justification

Only Prometheus keeps history and can alert. The other three show the current state of one thing, to a human who is looking at it:

- `watch` re-runs a command in a terminal. It keeps nothing and covers one machine.
- `kubectl top pods` (metrics-server, bundled with k3s) gives instant CPU and memory only. There is no history, no HTTP-level signal and no alerting.
- The Traefik dashboard only shows how Traefik is configured right now (its routers, services and middlewares). It has no request rates, error ratios or history. It would also have to be published on the cluster's public entrypoint, and #126 already had to fix an internal-only app becoming reachable by anyone on the public prod cluster.
- Prometheus already has data to scrape with zero application changes: Traefik exposes request counters and latency histograms on `:9100`, and the kubelet exposes per-container metrics (cAdvisor). Alertmanager turns them into alerts.

**The stack chosen**

- **Prometheus server**: scrapes and stores the metrics and evaluates the alert rules. Sources: Traefik's metrics port (request counters, latency histograms) and the kubelet's cAdvisor (per-container CPU and memory). The four first alerts are 5xx ratio, p95 latency, memory near the limit and a scrape target down. The chart's default jobs also scrape the API server and the kubelet's own metrics: on a local k3s they return about 36,000 series each, around 92% of the 78,600 series measured, and no alert uses them. That scrape volume, not application traffic, is what drives the disk and memory Prometheus needs.
- **Alertmanager**: groups and routes firing alerts. Its receiver is a no-op for now: there is no notification target yet, and one should not be invented in git. Alerts are visible in its UI until a real one (Slack, ntfy, ...) is chosen, with its secret kept out of the repo.
- **The upstream `prometheus` Helm chart, deployed by Argo CD**: no chart of our own to maintain, and it follows the GitOps flow of #126. Local k3s (`monitoring-k3s-app.yaml`) and prod (`monitoring-prod-app.yaml`) run the same chart version and rules, so a rule can be tried locally first. Prod has a persistent volume, a size cap on the metrics store, a memory limit and manual sync, like `ztk-prod`.
- **Left out on purpose**:
  - kube-state-metrics: not needed for the first alerts. It is the first thing to add for crash-loop and restart alerts.
  - node-exporter: it fails under rootless k3s (it needs to bind-mount the host root), and cAdvisor already covers per-container usage.
  - pushgateway: nothing in the project pushes metrics to it.
  - Grafana: the Prometheus UI is enough to read the graphs and the alert state for now.
  - `kube-prometheus-stack` (operator, CRDs, Grafana): more to run and upgrade than one app on a small cluster needs.
- **No public exposure**: both UIs stay ClusterIP and are opened with `kubectl port-forward`, like Argo CD and the RabbitMQ UI. Nothing is added to the Traefik routes.

`watch`, `kubectl top` and the Traefik dashboard stay available as debugging aids. They are not monitoring.

### Consequences -- Upside

- Error rate, latency and resource use are kept over time, so a problem can be looked at after it happened.
- Alerts exist (5xx ratio, latency, container memory, scrape target down), even if they have nowhere to go yet.
- No change to the backend, auth or frontend images.
- Local k3s and prod run the same stack, so a rule can be tried locally first.

### Consequences -- Trade-offs and risks

- Visibility stops at the edge and at the container: no application metrics (per-endpoint errors, queue depth, database timings) until the services expose a `/metrics` endpoint.
- Without kube-state-metrics there are no crash-loop, restart-count or replica-availability alerts.
- Alertmanager has no notification receiver (a no-op receiver). Alerts are only visible in its UI until a real target (Slack, ntfy, ...) is chosen. That target and its secret are a follow-up.
- Prod needs a persistent volume and retention tuning, and consumes cluster resources next to the app. Measured on a local k3s: about 78,600 series, 1,300 samples/s and 300-330 MiB of memory, which is an estimated 750-1500 MiB of disk for 7 days, close to the 1500MB cap set for the VPS. Not scraping the unused API server and kubelet jobs would cut that roughly ten times; that is not done yet.
- The alert rules are written inline in two Argo CD Applications (local k3s and prod) so each stays self-contained and editable from a local checkout. They can drift.
- Prod relies on the cluster's Traefik exposing its metrics port with the usual `prometheus.io/*` pod annotations (k3s does).

### Impact size

Small -- hours

### References

- #123 Kubernetes packaging, #126 GitOps delivery via Argo CD, #113 Deployment configuration
- Implementation: issue #158, PR #159
- `deployment/argocd/environments/monitoring-k3s-app.yaml`
- https://doc.traefik.io/traefik/observability/metrics/prometheus/
- https://github.com/prometheus-community/helm-charts/tree/main/charts/prometheus




---

### Amendment 2026-09-29: Grafana added

**What changed.** The decision above said "No Grafana" and listed Grafana under *Left out on purpose* ("the Prometheus UI is enough to read the graphs and the alert state for now"). That no longer holds, and this amendment supersedes those two statements. Everything else in the ADR stands.

**Why.** While testing PR #159 the Prometheus UI turned out not to be enough:

- there is no dashboard to see the request rate, 5xx ratio, latency and container memory side by side, so every question needs a hand-written query;
- alert history is only visible by graphing the `ALERTS` series in a separate query page, and a person had no easy way to see which alerts had been pending or firing earlier;
- a pending alert (not sent to Alertmanager until its `for` delay is over) is easy to mistake for a broken Alertmanager.

**Decision.** Add Grafana, deployed by Argo CD like the rest, from the maintained `grafana-community/grafana` Helm chart (the old `grafana/grafana` chart is deprecated and has moved there):

- Local k3s (`grafana-k3s-app.yaml`) and prod (`grafana-prod-app.yaml`), in the `monitoring` namespace, ClusterIP only and opened with `kubectl port-forward` like the other UIs. `just up-local` installs the local one.
- Provisioned from the Application, nothing to click: a Prometheus datasource, an Alertmanager datasource and one read-only dashboard, *Zero To Kanban overview* (alerts firing and pending, alert history, scrape targets down, Traefik request rate, 5xx ratio and p95 latency, memory against the limit, CPU and memory per pod).
- Prod: the admin login is a pre-created Secret (`ztk-grafana-admin`), never in git; a 1Gi volume; manual sync and no finalizer, like `ztk-prod`.

**Consequences.**

- More to run: measured about 270 MiB of memory (limit 768 Mi; 256 Mi got the pod OOM-killed). Together with Prometheus this is heavy for a small VPS, so re-check `kubectl top` after the first prod sync.
- The dashboard JSON is duplicated in the two Applications, like the alert rules, and can drift.
- Grafana adds a second place to read alerts, not a way to be told about them: Alertmanager still has no receiver, and nobody is notified. That follow-up is unchanged.
- Still left out: kube-state-metrics, node-exporter, pushgateway, `kube-prometheus-stack`.

**References.** PR #159, `deployment/argocd/environments/grafana-k3s-app.yaml`, `grafana-prod-app.yaml`.

---
## Comments

#### @Julian52575 -- 2026-09-30 19:42Z

/commit adr-catch-up

