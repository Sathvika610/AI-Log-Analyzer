import { SampleLogDataset } from '../types/loglens';

export const SAMPLE_LOG_DATASETS: SampleLogDataset[] = [
  {
    id: 'node-memory-leak',
    title: 'Node.js / Express Unhandled Exception & Memory Leak',
    shortLabel: 'Node.js OOM & Exception',
    environment: 'api-gateway-prod · Node 20.11',
    description: 'Unbounded session payload caching triggers V8 heap exhaustion and unhandled rejection crashes.',
    content: `2026-11-13T08:13:40.002Z INFO  [api-gateway] Starting Express HTTP server node=v20.11.1 pid=4812 env=production region=us-east-1
2026-11-13T08:13:40.118Z INFO  [config] Loaded environment variables from /etc/secrets/gateway.env (24 keys)
2026-11-13T08:13:40.295Z INFO  [api-gateway] Registered 18 REST routes and Prometheus /metrics exporter on :9090
2026-11-13T08:13:40.410Z INFO  [redis] Connected to rate-limit store redis-cluster.internal:6379 (latency=1.8ms)
2026-11-13T08:13:40.502Z INFO  [healthcheck] Readiness probe listening on /healthz (interval=5s)
2026-11-13T08:13:45.011Z INFO  [http] GET /healthz 200 1.1ms req_id=hc-001
2026-11-13T08:13:47.204Z INFO  [http] GET /api/v2/tenants/org_94f12/settings 200 14.2ms req_id=req-8801a
2026-11-13T08:13:48.882Z INFO  [auth] JWT verified for user_id=usr_1042 tenant_id=org_94f12 scopes=[read,write]
2026-11-13T08:13:50.015Z INFO  [http] GET /healthz 200 1.2ms req_id=hc-002
2026-11-13T08:13:52.109Z INFO  [http] POST /api/v2/webhooks/stripe 200 38.4ms req_id=req-8805c
2026-11-13T08:13:54.442Z INFO  [http] GET /api/v2/orders?limit=25 200 22.9ms req_id=req-8808f
2026-11-13T08:13:55.012Z INFO  [http] GET /healthz 200 1.3ms req_id=hc-003
2026-11-13T08:13:58.610Z INFO  [cache] Hydrating request buffer key=sess_7680a size=1.1MB
2026-11-13T08:14:00.014Z INFO  [http] GET /healthz 200 1.1ms req_id=hc-004
2026-11-13T08:14:02.104Z INFO  [http] POST /api/v2/exports/csv 202 64.1ms req_id=req-8812d
2026-11-13T08:14:04.319Z INFO  [metrics] Scraped /metrics by prometheus-prod-01 (rss=312MB heapUsed=218MB)
2026-11-13T08:14:05.012Z INFO  [http] GET /healthz 200 1.2ms req_id=hc-005
2026-11-13T08:14:08.774Z INFO  [http] GET /api/v2/users/me 200 9.8ms req_id=req-8815b
2026-11-13T08:14:10.015Z INFO  [http] GET /healthz 200 1.1ms req_id=hc-006
2026-11-13T08:14:12.440Z INFO  [http] POST /api/v2/webhooks/stripe 200 42.6ms req_id=req-8821a
2026-11-13T08:14:14.892Z INFO  [auth] Token verified for tenant_id=org_94f12 scopes=[read,write]
2026-11-13T08:14:15.014Z INFO  [http] GET /healthz 200 1.4ms req_id=hc-007
2026-11-13T08:14:18.210Z INFO  [cache] Hydrating request buffer key=sess_7712b size=6.4MB
2026-11-13T08:14:20.011Z INFO  [http] GET /healthz 200 1.3ms req_id=hc-008
2026-11-13T08:14:22.419Z INFO  [http] POST /api/v2/webhooks/github 200 51.0ms req_id=req-8824k
2026-11-13T08:14:24.718Z INFO  [http] POST /api/v2/exports/bulk 202 118.4ms req_id=req-8829c
2026-11-13T08:14:25.018Z INFO  [http] GET /healthz 200 1.8ms req_id=hc-009
2026-11-13T08:14:27.802Z INFO  [metrics] Scraped /metrics by prometheus-prod-01 (rss=984MB heapUsed=842MB)
2026-11-13T08:14:29.501Z INFO  [cache] Hydrating request buffer key=sess_7790f size=18.8MB
2026-11-13T08:14:30.014Z INFO  [http] GET /healthz 200 2.1ms req_id=hc-010
2026-11-13T08:14:33.112Z WARN  [gc-monitor] V8 old-space heap usage at 72% (1108MB / 1536MB); Scavenge GC frequency elevated
2026-11-13T08:14:35.016Z INFO  [http] GET /healthz 200 3.4ms req_id=hc-011
2026-11-13T08:14:37.904Z INFO  [cache] Hydrating request buffer key=sess_7811a size=32.6MB
2026-11-13T08:14:40.022Z INFO  [http] GET /healthz 200 4.9ms req_id=hc-012
2026-11-13T08:14:42.660Z WARN  [gc-monitor] V8 old-space heap usage at 84% (1290MB / 1536MB); Mark-Sweep-Compact pause 214ms
2026-11-13T08:14:44.105Z INFO  [http] POST /api/v2/webhooks/stripe 200 63.2ms req_id=req-8840d
2026-11-13T08:14:45.019Z INFO  [http] GET /healthz 200 8.7ms req_id=hc-013
2026-11-13T08:14:47.338Z WARN  [event-loop] Event loop lag spike detected: 348ms (threshold=100ms)
2026-11-13T08:14:48.990Z WARN  [session-cache] Global in-memory requestCache Map exceeded 15,000 retained entries without TTL eviction (size=1412MB)
2026-11-13T08:14:50.028Z INFO  [http] GET /healthz 200 19.2ms req_id=hc-014
2026-11-13T08:14:51.904Z ERROR [session-cache] UnhandledPromiseRejectionWarning: TypeError: Cannot read properties of undefined (reading 'payload') in sessionCacheMiddleware (/app/dist/middleware/sessionCache.js:142:29) — uncaught throw bypassed requestCache.delete(reqId), leaking 64MB buffer
    at processWebhookEnvelope (/app/dist/middleware/sessionCache.js:142:29)
    at sessionCacheMiddleware (/app/dist/middleware/sessionCache.js:88:14)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at /app/node_modules/express/lib/router/index.js:284:15
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
2026-11-13T08:14:52.115Z WARN  [session-cache] Retained orphaned 64MB webhook buffer for req-8854e in requestCache Map (entries=15001)
2026-11-13T08:14:53.402Z ERROR [http] POST /api/v2/webhooks/github 500 1842.1ms req_id=req-8854e err="ERR_MEMORY_PRESSURE"
2026-11-13T08:14:54.118Z WARN  [gc-monitor] V8 old-space heap usage at 96% (1474MB / 1536MB); Mark-Sweep-Compact pause 892ms
2026-11-13T08:14:55.041Z WARN  [http] GET /healthz 200 412.6ms req_id=hc-015 (degraded response latency)
2026-11-13T08:14:55.810Z WARN  [event-loop] Event loop blocked for 1120ms during synchronous V8 GC cycle
2026-11-13T08:14:56.229Z ERROR [worker] FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
 1: 0xb9c1f0 node::Abort() [node]
 2: 0xa7042e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 3: 0xa70737 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, v8::OOMDetails const&) [node]
 4: 0xc82c95 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [node]
 5: 0xc5e4f1 v8::internal::HeapAllocator::AllocateRawWithLightRetrySlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 6: 0xc5f8b5 v8::internal::HeapAllocator::AllocateRawWithRetryOrFailSlowPath(int, v8::internal::AllocationType, v8::internal::AllocationOrigin, v8::internal::AllocationAlignment) [node]
 7: 0xc3caa6 v8::internal::Factory::NewFillerObject(int, bool, v8::internal::AllocationType, v8::internal::AllocationOrigin) [node]
 8: 0x1055b76 v8::internal::Runtime_AllocateInYoungGeneration(int, unsigned long*, v8::internal::Isolate*) [node]
2026-11-13T08:14:56.390Z ERROR [supervisor] Worker pid=4812 exited unexpectedly with signal SIGABRT (exit code 134)
2026-11-13T08:14:56.412Z ERROR [load-balancer] Upstream 10.24.18.91:3000 connection reset by peer while proxying /api/v2/orders
2026-11-13T08:14:56.519Z ERROR [http] GET /healthz 503 Service Unavailable — upstream worker pool empty
2026-11-13T08:14:57.004Z ERROR [http] POST /api/v2/checkout 502 Bad Gateway req_id=req-8860k upstream=10.24.18.91:3000
2026-11-13T08:14:57.441Z ERROR [http] GET /api/v2/users/me 502 Bad Gateway req_id=req-8861m upstream=10.24.18.91:3000
2026-11-13T08:14:57.882Z ERROR [http] POST /api/v2/webhooks/stripe 502 Bad Gateway req_id=req-8863n upstream=10.24.18.91:3000
2026-11-13T08:14:58.110Z WARN  [supervisor] Attempting cold restart of api-gateway worker (attempt 1/5)
2026-11-13T08:14:59.220Z INFO  [api-gateway] Booting express-worker pid=5104 env=production region=us-east-1
2026-11-13T08:15:00.015Z INFO  [http] GET /healthz 200 2.1ms req_id=hc-016`
  },
  {
    id: 'postgres-pool-exhaustion',
    title: 'PostgreSQL Connection Pool Exhaustion & Cascading API 502s',
    shortLabel: 'Postgres Pool Exhaustion',
    environment: 'checkout-service · pg-pool 3.6',
    description: 'Leaked transaction clients inside an early-return branch starve the DB pool and trigger API 502 timeouts.',
    content: `2026-11-13T11:39:40.012Z INFO  [checkout-api] Booting checkout-service v4.9.0 commit=a81f92c node=v20.14.0
2026-11-13T11:39:40.101Z INFO  [pg-pool] Initialized PostgreSQL pool host=rds-prod-orders.internal max=25 idleTimeoutMillis=30000 connectionTimeoutMillis=5000
2026-11-13T11:39:40.440Z INFO  [pg-pool] Verified primary DB connectivity (PostgreSQL 16.3 on x86_64-pc-linux-gnu)
2026-11-13T11:39:41.224Z INFO  [checkout-api] Service ready on port 8080 (workers=4)
2026-11-13T11:39:43.008Z INFO  [http] GET /healthz 200 2ms pool_active=1 pool_idle=4 pool_waiting=0
2026-11-13T11:39:45.419Z INFO  [orders] Order #ord_99095 committed in 16ms (pool_active=2 pool_idle=3)
2026-11-13T11:39:47.110Z INFO  [http] GET /api/v1/cart/usr_2091 200 9ms
2026-11-13T11:39:49.005Z INFO  [http] GET /healthz 200 1ms pool_active=1 pool_idle=4 pool_waiting=0
2026-11-13T11:39:51.630Z INFO  [orders] Order #ord_99098 committed in 21ms (pool_active=2 pool_idle=3)
2026-11-13T11:39:53.882Z INFO  [http] GET /api/v1/cart/usr_4412 200 11ms
2026-11-13T11:39:55.009Z INFO  [http] GET /healthz 200 1ms pool_active=1 pool_idle=4 pool_waiting=0
2026-11-13T11:39:57.104Z INFO  [inventory] Reserved SKU=sku_pro_99 qty=2 in 14ms (pool_active=2 pool_idle=3)
2026-11-13T11:39:59.419Z INFO  [orders] Order #ord_99102 committed in 18ms (pool_active=2 pool_idle=3)
2026-11-13T11:40:01.006Z INFO  [http] GET /healthz 200 2ms pool_active=1 pool_idle=4 pool_waiting=0
2026-11-13T11:40:03.220Z INFO  [http] GET /api/v1/orders/history?user=usr_4412 200 19ms
2026-11-13T11:40:06.110Z INFO  [http] GET /healthz 200 1ms pool_active=1 pool_idle=4 pool_waiting=0
2026-11-13T11:40:09.304Z INFO  [reconciler] Starting nightly ledger batch reconciliation job_id=rec_20261113 (batch_size=500)
2026-11-13T11:40:10.118Z INFO  [reconciler] Acquired pg client for invoice_id=inv_7001 (pool_active=3 pool_idle=4)
2026-11-13T11:40:10.422Z INFO  [reconciler] Reconciled invoice_id=inv_7001 status=SETTLED (released client)
2026-11-13T11:40:11.004Z INFO  [http] GET /healthz 200 2ms pool_active=3 pool_idle=4 pool_waiting=0
2026-11-13T11:40:12.811Z INFO  [reconciler] Acquired pg client for invoice_id=inv_7012 (pool_active=4 pool_idle=3)
2026-11-13T11:40:13.911Z INFO  [reconciler] Reconciled invoice_id=inv_7012 status=SETTLED (released client)
2026-11-13T11:40:15.004Z INFO  [http] GET /healthz 200 2ms pool_active=5 pool_idle=3 pool_waiting=0
2026-11-13T11:40:16.712Z ERROR [reconciler] Duplicate idempotency key inv_7014 in reconcileInvoice() (/srv/checkout/src/jobs/reconciler.ts:94:15) — returned early before try/finally client.release()
    at reconcileInvoice (/srv/checkout/src/jobs/reconciler.ts:94:15)
    at async runLedgerBatch (/srv/checkout/src/jobs/reconciler.ts:48:9)
    at async JobRunner.execute (/srv/checkout/src/worker/runner.ts:112:5)
2026-11-13T11:40:17.205Z ERROR [reconciler] Duplicate idempotency key inv_7015 in reconcileInvoice() (/srv/checkout/src/jobs/reconciler.ts:94:15) — client leaked
    at reconcileInvoice (/srv/checkout/src/jobs/reconciler.ts:94:15)
    at async runLedgerBatch (/srv/checkout/src/jobs/reconciler.ts:48:9)
2026-11-13T11:40:18.210Z WARN  [pg-pool] Active connections increasing: pool_active=12/25 pool_idle=0 pool_waiting=0
2026-11-13T11:40:19.550Z INFO  [orders] Order #ord_99108 committed in 24ms (pool_active=14 pool_idle=0)
2026-11-13T11:40:21.005Z INFO  [http] GET /healthz 200 3ms pool_active=16/25 pool_idle=0 pool_waiting=0
2026-11-13T11:40:22.412Z WARN  [pg-pool] Connection leak suspected: 18 clients checked out > 10000ms without release (caller=reconcileInvoice)
2026-11-13T11:40:24.819Z WARN  [pg-pool] Pool saturation at 88%: pool_active=22/25 pool_idle=0 pool_waiting=3
2026-11-13T11:40:26.102Z WARN  [pg-pool] Pool saturation at 100%: pool_active=25/25 pool_idle=0 pool_waiting=14
2026-11-13T11:40:27.009Z INFO  [http] GET /healthz 200 4ms (skipping DB ping)
2026-11-13T11:40:28.415Z WARN  [pg-pool] Checkout acquire latency > 3200ms (pool_waiting=21)
2026-11-13T11:40:31.108Z ERROR [pg-pool] Error: timeout exceeded when trying to connect (connectionTimeoutMillis=5000ms) pool_active=25/25 pool_waiting=29
    at Timeout._onTimeout (/srv/checkout/node_modules/pg-pool/index.js:205:19)
    at listOnTimeout (node:internal/timers:573:17)
    at process.processTimers (node:internal/timers:514:7)
2026-11-13T11:40:31.214Z ERROR [orders] Failed POST /api/v1/checkout for user=usr_8821: Error: timeout exceeded when trying to connect
    at CheckoutRepository.createOrder (/srv/checkout/src/repos/checkoutRepo.ts:62:24)
    at CheckoutController.submit (/srv/checkout/src/controllers/checkout.ts:119:31)
    at Layer.handle [as handle_request] (/srv/checkout/node_modules/express/lib/router/layer.js:95:5)
2026-11-13T11:40:31.490Z ERROR [inventory] Failed POST /api/v1/inventory/reserve: Error: timeout exceeded when trying to connect (pool_waiting=34)
    at InventoryRepo.lockStock (/srv/checkout/src/repos/inventoryRepo.ts:41:19)
    at InventoryController.reserve (/srv/checkout/src/controllers/inventory.ts:74:22)
2026-11-13T11:40:32.005Z ERROR [nginx-ingress] 2026/11/13 11:40:32 [error] 41#41: *90412 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 172.16.4.12, server: api.acme.io, request: "POST /api/v1/checkout HTTP/1.1", upstream: "http://10.0.14.22:8080/api/v1/checkout"
2026-11-13T11:40:32.330Z ERROR [http] POST /api/v1/checkout -> 502 Bad Gateway (upstream timeout 5004ms)
2026-11-13T11:40:32.891Z ERROR [http] GET /api/v1/orders/history -> 502 Bad Gateway (upstream timeout 5002ms)
2026-11-13T11:40:33.140Z ERROR [payments] Webhook retry failed for charge_id=ch_3Q91x: Stripe confirmation could not persist order status (502 Bad Gateway)
2026-11-13T11:40:33.780Z ERROR [http] POST /api/v1/cart/apply-coupon -> 502 Bad Gateway (upstream timeout 5001ms)
2026-11-13T11:40:34.018Z WARN  [circuit-breaker] Opening circuit for postgresql-primary after 10 consecutive acquire timeouts (errorRate=100%)
2026-11-13T11:40:35.012Z ERROR [http] POST /api/v1/checkout -> 503 Service Unavailable (CircuitBreakerOpen: postgresql-primary)
2026-11-13T11:40:36.221Z ERROR [http] GET /api/v1/cart/usr_1190 -> 503 Service Unavailable (CircuitBreakerOpen: postgresql-primary)
2026-11-13T11:40:37.104Z ERROR [http] POST /api/v1/orders/refund -> 503 Service Unavailable (CircuitBreakerOpen: postgresql-primary)
2026-11-13T11:40:38.005Z INFO  [alert-manager] PagerDuty incident triggered: [SEV-1] checkout-service 5xx spike > 45% in us-east-1
2026-11-13T11:40:40.001Z INFO  [metrics] p99_latency=5012ms active_db_conns=25 waiting_queue=61 dropped_requests=48`
  },
  {
    id: 'k8s-redis-crashloop',
    title: 'Kubernetes Pod CrashLoopBackOff / Redis Auth Failure',
    shortLabel: 'K8s CrashLoop / Redis Auth',
    environment: 'prod-eks-cluster · auth-worker',
    description: 'Rotated Redis ACL password mismatch causes ioredis connection abort, readiness failure, and CrashLoopBackOff.',
    content: `2026-11-13T19:01:50.112Z INFO  [kube-controller] ReplicaSet "auth-worker-6f8d9c4b7" scaled up pod "auth-worker-6f8d9c4b7-x92kp" (replicas=3)
2026-11-13T19:01:51.004Z INFO  [external-secrets] Reconciling ExternalSecret "redis-credentials" in namespace="production"
2026-11-13T19:01:52.318Z INFO  [external-secrets] Notice: Redis cluster ACL rotation completed 2m ago on redis-session-master (new Secret version rv-491994 stored)
2026-11-13T19:01:55.002Z INFO  [kube-scheduler] Successfully assigned production/auth-worker-6f8d9c4b7-x92kp to ip-10-42-8-19.ec2.internal
2026-11-13T19:01:55.418Z INFO  [kubelet] SyncLoop ADD pod="auth-worker-6f8d9c4b7-x92kp" namespace="production" uid="7c9a12e4-88b1"
2026-11-13T19:01:55.890Z INFO  [kubelet] Pulling image "ghcr.io/acme/auth-worker:v2.14.3" (already present on machine)
2026-11-13T19:01:56.120Z INFO  [cni] Allocated pod IP 10.42.8.194/24 on interface eth0 (aws-vpc-cni)
2026-11-13T19:01:56.290Z INFO  [kubelet] Mounted projected volume kube-api-access-94k1m (readOnly=true)
2026-11-13T19:01:56.450Z INFO  [kubelet] Created container auth-worker; Started container auth-worker
2026-11-13T19:01:56.710Z INFO  [auth-worker] Starting auth-worker v2.14.3 pid=1 env=production node=v20.16.0
2026-11-13T19:01:56.805Z INFO  [config] Loaded ConfigMap "auth-worker-config" (REDIS_HOST=redis-session-master.production.svc.cluster.local:6379, REDIS_TLS=true)
2026-11-13T19:01:56.818Z INFO  [config] Loaded env Secret "redis-credentials" cached revision="rv-491820" (key=REDIS_PASSWORD checksum=sha256:9f82a1)
2026-11-13T19:01:56.940Z WARN  [config] Secret mount checksum=sha256:9f82a1 differs from latest ExternalSecret revision rv-491994 (reloader annotation missing on Deployment)
2026-11-13T19:01:57.015Z INFO  [http] Metrics & probe server listening on 0.0.0.0:8081 (/livez, /readyz)
2026-11-13T19:01:57.110Z INFO  [postgres] Connected to auth-db-ro.internal:5432 (pool_size=10)
2026-11-13T19:01:57.290Z INFO  [redis] Initiating TLS handshake with redis-session-master.production.svc.cluster.local:6379
2026-11-13T19:01:57.402Z INFO  [redis] TLS handshake completed (protocol=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384)
2026-11-13T19:01:57.448Z ERROR [redis] ReplyError: WRONGPASS invalid username-password pair or user is disabled. (auth-worker sent stale REDIS_PASSWORD checksum=sha256:9f82a1 against rotated Redis ACL)
    at parseError (/app/node_modules/redis-parser/lib/parser.js:179:12)
    at parseType (/app/node_modules/redis-parser/lib/parser.js:302:14)
    at Socket.<anonymous> (/app/node_modules/ioredis/built/Redis.js:176:22)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
2026-11-13T19:01:57.610Z WARN  [redis] ioredis retryStrategy attempt=1 delay=200ms err="WRONGPASS invalid username-password pair"
2026-11-13T19:01:57.845Z ERROR [redis] ReplyError: WRONGPASS invalid username-password pair or user is disabled.
2026-11-13T19:01:58.110Z WARN  [redis] ioredis retryStrategy attempt=2 delay=400ms err="WRONGPASS invalid username-password pair"
2026-11-13T19:01:58.580Z ERROR [redis] ReplyError: WRONGPASS invalid username-password pair or user is disabled.
2026-11-13T19:01:58.910Z WARN  [redis] ioredis retryStrategy attempt=3 delay=800ms err="WRONGPASS invalid username-password pair"
2026-11-13T19:01:59.715Z ERROR [redis] MaxRetriesPerRequestError: Reached the max retries per request limit (which is 3). Refer to "maxRetriesPerRequest" option for details.
    at Socket.<anonymous> (/app/node_modules/ioredis/built/redis/event_handler.js:182:37)
    at Object.onceWrapper (node:events:633:26)
    at Socket.emit (node:events:518:28)
    at Redis.silentEmit (/app/node_modules/ioredis/built/Redis.js:385:28)
    at Connection.emit (/app/node_modules/ioredis/built/cluster/Connection.js:41:14)
2026-11-13T19:01:59.790Z ERROR [auth-worker] Fatal startup error: unable to initialize Redis session store; aborting bootstrap
2026-11-13T19:02:00.010Z INFO  [kubelet] Readiness probe failed: Get "http://10.42.8.194:8081/readyz": dial tcp 10.42.8.194:8081: connect: connection refused
2026-11-13T19:02:00.055Z ERROR [kubelet] Container auth-worker in pod auth-worker-6f8d9c4b7-x92kp terminated with Exit Code 1 (Error)
2026-11-13T19:02:01.200Z WARN  [kubelet] Restarting container auth-worker (restartCount=1)
2026-11-13T19:02:01.810Z INFO  [auth-worker] Starting auth-worker v2.14.3 pid=1 env=production node=v20.16.0
2026-11-13T19:02:02.102Z ERROR [redis] ReplyError: WRONGPASS invalid username-password pair or user is disabled.
    at parseError (/app/node_modules/redis-parser/lib/parser.js:179:12)
    at parseType (/app/node_modules/redis-parser/lib/parser.js:302:14)
    at Socket.<anonymous> (/app/node_modules/ioredis/built/Redis.js:176:22)
2026-11-13T19:02:03.900Z ERROR [auth-worker] Fatal startup error: unable to initialize Redis session store; aborting bootstrap
2026-11-13T19:02:04.215Z ERROR [kubelet] Container auth-worker terminated with Exit Code 1 (Error) (restartCount=2)
2026-11-13T19:02:05.100Z WARN  [kubelet] Liveness probe failed: Get "http://10.42.8.194:8081/livez": dial tcp 10.42.8.194:8081: connect: connection refused
2026-11-13T19:02:14.400Z WARN  [kubelet] Back-off 10s restarting failed container=auth-worker pod=auth-worker-6f8d9c4b7-x92kp_production
2026-11-13T19:02:14.412Z ERROR [k8s-events] Pod production/auth-worker-6f8d9c4b7-x92kp entered state CrashLoopBackOff (BackOff: Back-off restarting failed container)
2026-11-13T19:02:16.005Z ERROR [ingress-nginx] Endpoints "auth-worker-svc" has 0 ready addresses; returning 503 Service Temporarily Unavailable for /oauth/token
2026-11-13T19:02:17.220Z ERROR [ingress-nginx] Endpoints "auth-worker-svc" has 0 ready addresses; returning 503 Service Temporarily Unavailable for /oauth/authorize
2026-11-13T19:02:18.119Z ERROR [api-gateway] Upstream auth-worker-svc:8080 failed 503 during JWT session validation req_id=gw-4410p
2026-11-13T19:02:20.440Z ERROR [api-gateway] Upstream auth-worker-svc:8080 failed 503 during OAuth refresh req_id=gw-4418r
2026-11-13T19:02:22.918Z ERROR [billing-svc] Token introspection failed 503 calling http://auth-worker-svc.production.svc.cluster.local:8080/internal/introspect
2026-11-13T19:02:25.500Z WARN  [hpa-controller] HorizontalPodAutoscaler auth-worker-hpa unable to compute replica metrics: missing pods/ready
2026-11-13T19:02:28.112Z INFO  [alert-manager] Triggered alert KubePodCrashLooping namespace=production pod=auth-worker-6f8d9c4b7-x92kp`
  }
];
