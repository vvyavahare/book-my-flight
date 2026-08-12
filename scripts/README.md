# scripts

Convenience scripts for running and testing the platform locally. All are POSIX `bash` and
assume they are run from anywhere in the repo (they resolve paths relative to themselves).

| Script | What it does |
|--------|--------------|
| [`start-all.sh`](start-all.sh) | Builds the backend (skipping tests), starts flight-search (:8081), booking (:8082) and the gateway (:8080) in the background, waits for the gateway health check, then starts the frontend dev server (:3000). Backend logs go to `/tmp/airline-*.log`. |
| [`stop-all.sh`](stop-all.sh) | Stops the three backend services (matched by their jar names). The frontend dev server, if started via `start-all.sh`, stops with `Ctrl-C`. |
| [`smoke-test.sh`](smoke-test.sh) | Drives the end-to-end slice through the gateway: unauthenticated `401` → login → search → book → fetch. Honors `GATEWAY_URL` (default `http://localhost:8080`). |
| [`render-diagrams.sh`](render-diagrams.sh) | Renders all PlantUML package and domain diagrams to the SVG files embedded in the READMEs. Requires `plantuml` or a `PLANTUML_JAR` environment variable. |

## Examples

```bash
./scripts/start-all.sh                 # bring the whole stack up
./scripts/smoke-test.sh                # verify the slice end-to-end
GATEWAY_URL=http://localhost:8080 ./scripts/smoke-test.sh
./scripts/render-diagrams.sh           # refresh README diagram images
./scripts/stop-all.sh                  # stop backend services
```

> These are dev conveniences. For production you would containerise each service (see
> [`../infra`](../infra)) and orchestrate with Docker Compose / Kubernetes.
