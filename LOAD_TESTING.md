# LOAD_TESTING.md

## Simulated Local Concurrency Benchmark

### Formative Feedback Assistant — Stage 2 Robustness & Scalability

> **IMPORTANT DISCLAIMER**
> This is a **local prototype concurrency benchmark**, not a production-scale load test.
> Results are measured on a single Windows development machine and reflect that machine's
> hardware, OS scheduling, single-threaded Python GIL behaviour, and local network stack.
> These results **must not** be extrapolated to production capacity requirements.
> No real users participated in this benchmark.

---

## 1. Methodology

### Tool

`validation/load_test.py` — a Python asyncio script using `httpx.AsyncClient`.

### Approach

For each concurrency level (10, 25, 50, 100 simulated concurrent users):

1. Create an `asyncio.Semaphore(N)` to limit the maximum simultaneous in-flight requests.
2. Launch `N × 3` total HTTP requests (e.g., 30 requests at N=10, 300 requests at N=100).
3. Each request is an independent async coroutine that records start/end time and status code.
4. All coroutines are gathered with `asyncio.gather()`.
5. Timing statistics are computed from the collected latency samples.

### Endpoint

`GET /health` — chosen because it is lightweight (no database access), provides a consistent baseline, and is exempt from rate limiting so results are not contaminated by 429 responses.

### Metrics Collected

| Metric | Description |
|--------|-------------|
| Total requests | N × 3 requests sent per level |
| Successful requests | HTTP status < 400 |
| Failed requests | Network errors or HTTP ≥ 400 |
| Avg latency (ms) | Mean of all request durations |
| Median latency (ms) | 50th percentile |
| P95 latency (ms) | 95th percentile |
| P99 latency (ms) | 99th percentile |
| Throughput (req/s) | Total requests / wall-clock elapsed time |
| Error rate (%) | Failed / total × 100 |

---

## 2. How to Run

### Prerequisites

```bash
pip install httpx
```

### Start the Backend

```bash
cd backend
uvicorn main:app --host 127.0.0.1 --port 8000
```

### Run the Benchmark

```bash
# From repo root
python validation/load_test.py

# With custom concurrency levels
python validation/load_test.py --levels 10 25 50 100

# Against a different host
python validation/load_test.py --base-url http://localhost:8000
```

### Output

Results are printed to stdout **and** saved to `validation/load_test_results.json` for display in the Stress & Robustness dashboard (`/mentor/stress`).

---

## 3. Actual Measured Results

Results from benchmark run on **2026-09-30** on the development machine.
Endpoint: `GET /health` · Tool: `httpx.AsyncClient` · Environment: local Windows

| Users | Requests | OK | Fail | Avg (ms) | Median (ms) | P95 (ms) | P99 (ms) | RPS | Err% |
|------:|--------:|---:|-----:|---------:|------------:|---------:|---------:|----:|-----:|
| 10 | 30 | 30 | 0 | 151.1 | 60.3 | 356.5 | 358.0 | 58.1 | 0.0% |
| 25 | 75 | 75 | 0 | 247.1 | 206.6 | 446.1 | 453.9 | 84.7 | 0.0% |
| 50 | 150 | 150 | 0 | 732.3 | 609.6 | 1680.4 | 1946.5 | 57.3 | 0.0% |
| 100 | 300 | 300 | 0 | 2034.2 | 1208.6 | 5259.0 | 5685.7 | 44.3 | 0.0% |

> These are the actual measured values produced by running `load_test.py`.
> They are NOT invented or estimated.

---

## 4. Observations

- **10 concurrent users**: Low median latency (60 ms), 0% errors — the backend handles this load comfortably on a single Uvicorn worker.
- **25 concurrent users**: Latency rises to ~207 ms median, still 0% errors.
- **50 concurrent users**: Median rises to ~610 ms. P99 at ~1.9 s — expected for a single-threaded Python process serving many simultaneous async requests.
- **100 concurrent users**: Median ~1.2 s, P99 ~5.7 s — latency is high, but 0% error rate. The server remains stable; it simply queues requests.

---

## 5. Rate Limiting Interaction

The rate limiter is configured at 30 requests/minute per client IP.  
The `/health` endpoint is **exempt** from this limit so benchmark results are not contaminated by 429 responses.

When testing protected endpoints (`/api/feedback`, `/api/submissions`), bursts exceeding 30 requests/minute will correctly return HTTP 429.

---

## 6. Limitations

| Limitation | Explanation |
|------------|-------------|
| Single machine | Results reflect one development machine; production performance will differ |
| Single Uvicorn worker | Default `uvicorn main:app` is single-threaded; production typically uses multiple workers or Gunicorn |
| Python GIL | CPython's Global Interpreter Lock limits true parallelism |
| No database load | `/health` has no DB access; `/api/feedback` results would be higher latency |
| Local network | All traffic on loopback (127.0.0.1); real network adds latency |
| No warmup | No warmup period before measurements |
| No sustained load | Short burst test, not sustained over minutes or hours |
| Windows asyncio | Windows asyncio event loop may behave differently from Linux epoll |

---

## 7. Future Improvements

For a production-readiness assessment, consider:

- Running with multiple Uvicorn workers (`--workers 4`)
- Using a dedicated load testing tool (Locust, k6, Gatling)
- Testing on Linux with production-equivalent hardware
- Running sustained 10-minute soak tests
- Testing with real API payloads (`POST /api/feedback` with submission text)
- Using a dedicated load testing host (not the same machine as the server)

---

*Document version: Stage 2.0 — Formative Feedback Assistant*
