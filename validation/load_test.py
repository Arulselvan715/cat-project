"""
load_test.py — Simulated Local Concurrency Benchmark
======================================================
Simulated Local Concurrency Benchmark — Not a Production-Scale Load Test

This script benchmarks the Formative Feedback Assistant API under simulated
concurrent load on a local machine.  It uses httpx.AsyncClient to send
concurrent requests and measures actual response-time statistics.

IMPORTANT DISCLAIMER
---------------------
* This is a LOCAL PROTOTYPE benchmark, not a production-scale load test.
* Results depend heavily on the local machine's hardware, OS scheduling, and
  Python async runtime.
* Results should NOT be extrapolated to production capacity requirements.
* No real users participated in this benchmark.
* The script labels all output accordingly.

Prerequisites
-------------
  pip install httpx

Usage
-----
  # Start the FastAPI backend first:
  #   cd backend && uvicorn main:app --reload

  python validation/load_test.py

  # Or specify different concurrency levels:
  python validation/load_test.py --levels 10 25 50 100

  # Or point to a different base URL:
  python validation/load_test.py --base-url http://localhost:8000

Output
------
Results are printed to stdout and saved to validation/load_test_results.json
for display in the Stress & Robustness dashboard.

Do NOT hardcode these results — they are always freshly measured.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Check for httpx
# ---------------------------------------------------------------------------
try:
    import httpx
except ImportError:
    print("ERROR: httpx is not installed. Run: pip install httpx")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_CONCURRENCY_LEVELS = [10, 25, 50, 100]
ENDPOINT = "/health"          # Lightweight endpoint for load testing
# We use /health to avoid DB writes in load test.
# A note is included in output about this choice.

RESULTS_FILE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "load_test_results.json"
)


# ---------------------------------------------------------------------------
# Single-request runner
# ---------------------------------------------------------------------------

async def _single_request(
    client: httpx.AsyncClient,
    url: str,
    semaphore: asyncio.Semaphore,
) -> Dict[str, Any]:
    """Send one GET request and return timing/status info."""
    async with semaphore:
        start = time.perf_counter()
        try:
            resp = await client.get(url, timeout=30.0)
            elapsed_ms = (time.perf_counter() - start) * 1000
            return {
                "status_code": resp.status_code,
                "elapsed_ms": elapsed_ms,
                "success": resp.status_code < 400,
                "error": None,
            }
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            return {
                "status_code": None,
                "elapsed_ms": elapsed_ms,
                "success": False,
                "error": str(exc),
            }


# ---------------------------------------------------------------------------
# Concurrency level runner
# ---------------------------------------------------------------------------

async def run_level(
    base_url: str,
    concurrency: int,
    total_requests: int,
) -> Dict[str, Any]:
    """
    Send `total_requests` requests with up to `concurrency` simultaneous connections.
    """
    url = f"{base_url}{ENDPOINT}"
    semaphore = asyncio.Semaphore(concurrency)
    limits = httpx.Limits(max_connections=concurrency, max_keepalive_connections=concurrency)

    start_time = time.perf_counter()

    async with httpx.AsyncClient(limits=limits) as client:
        tasks = [
            _single_request(client, url, semaphore)
            for _ in range(total_requests)
        ]
        results = await asyncio.gather(*tasks)

    total_elapsed = time.perf_counter() - start_time

    latencies = [r["elapsed_ms"] for r in results]
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]

    sorted_latencies = sorted(latencies)
    n = len(sorted_latencies)

    def percentile(data, p):
        if not data:
            return 0.0
        idx = max(0, min(n - 1, int(p / 100 * n)))
        return data[idx]

    return {
        "concurrency": concurrency,
        "total_requests": total_requests,
        "successful_requests": len(successes),
        "failed_requests": len(failures),
        "avg_latency_ms": round(statistics.mean(latencies), 2),
        "median_latency_ms": round(statistics.median(latencies), 2),
        "p95_latency_ms": round(percentile(sorted_latencies, 95), 2),
        "p99_latency_ms": round(percentile(sorted_latencies, 99), 2),
        "min_latency_ms": round(min(latencies), 2),
        "max_latency_ms": round(max(latencies), 2),
        "total_elapsed_s": round(total_elapsed, 3),
        "throughput_rps": round(total_requests / total_elapsed, 2),
        "error_rate_pct": round(len(failures) / total_requests * 100, 2),
        "errors": [r["error"] for r in failures if r["error"]],
    }


# ---------------------------------------------------------------------------
# Connectivity check
# ---------------------------------------------------------------------------

async def check_server(base_url: str) -> bool:
    """Check that the server is reachable before running the benchmark."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{base_url}/health", timeout=5.0)
            return resp.status_code == 200
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Main benchmark runner
# ---------------------------------------------------------------------------

async def run_benchmark(
    base_url: str,
    levels: List[int],
    requests_per_level: Optional[int] = None,
) -> Dict[str, Any]:
    print()
    print("=" * 65)
    print("  SIMULATED LOCAL CONCURRENCY BENCHMARK")
    print("  Not a Production-Scale Load Test")
    print("=" * 65)
    print(f"  Base URL    : {base_url}")
    print(f"  Endpoint    : {ENDPOINT}  (GET, lightweight health check)")
    print(f"  Levels      : {levels}")
    print(f"  Timestamp   : {datetime.now(timezone.utc).isoformat()}")
    print()
    print("  Checking server connectivity...")

    reachable = await check_server(base_url)
    if not reachable:
        print()
        print("  ERROR: Cannot reach server at", base_url)
        print("  Start the backend first: cd backend && uvicorn main:app")
        print()
        return {
            "error": f"Server not reachable at {base_url}",
            "results": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    print("  Server is reachable. Starting benchmark...")
    print()

    all_results = []
    for level in levels:
        n_requests = requests_per_level if requests_per_level else level * 3
        print(f"  Running: {level} concurrent users, {n_requests} total requests...")
        result = await run_level(base_url, level, n_requests)
        all_results.append(result)

        print(f"    Success : {result['successful_requests']}/{result['total_requests']}")
        print(f"    Avg lat : {result['avg_latency_ms']} ms")
        print(f"    Median  : {result['median_latency_ms']} ms")
        print(f"    P95     : {result['p95_latency_ms']} ms")
        print(f"    P99     : {result['p99_latency_ms']} ms")
        print(f"    Throughput: {result['throughput_rps']} req/s")
        print(f"    Errors  : {result['error_rate_pct']}%")
        print()

    return {
        "benchmark_label": "Simulated Local Concurrency Benchmark — Not a Production-Scale Load Test",
        "base_url": base_url,
        "endpoint": ENDPOINT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "results": all_results,
        "error": None,
    }


# ---------------------------------------------------------------------------
# Summary printer
# ---------------------------------------------------------------------------

def print_summary(data: Dict[str, Any]) -> None:
    print("-" * 65)
    print("  BENCHMARK SUMMARY")
    print("-" * 65)
    if data.get("error"):
        print(f"  ERROR: {data['error']}")
        return

    print(f"  {'Users':>6} {'Req':>5} {'OK':>5} {'Fail':>5} "
          f"{'Avg(ms)':>9} {'Med(ms)':>9} {'P95(ms)':>9} "
          f"{'P99(ms)':>9} {'RPS':>8} {'Err%':>6}")
    print(f"  {'-'*6} {'-'*5} {'-'*5} {'-'*5} "
          f"{'-'*9} {'-'*9} {'-'*9} "
          f"{'-'*9} {'-'*8} {'-'*6}")

    for r in data["results"]:
        print(
            f"  {r['concurrency']:>6} "
            f"{r['total_requests']:>5} "
            f"{r['successful_requests']:>5} "
            f"{r['failed_requests']:>5} "
            f"{r['avg_latency_ms']:>9.1f} "
            f"{r['median_latency_ms']:>9.1f} "
            f"{r['p95_latency_ms']:>9.1f} "
            f"{r['p99_latency_ms']:>9.1f} "
            f"{r['throughput_rps']:>8.1f} "
            f"{r['error_rate_pct']:>6.1f}"
        )

    print()
    print("  NOTE: Results are from a local prototype environment.")
    print("  Do NOT extrapolate to production capacity requirements.")
    print("=" * 65)
    print()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Formative Feedback Assistant — Local Concurrency Benchmark"
    )
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL,
        help=f"Base URL of the FastAPI server (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--levels", nargs="+", type=int, default=DEFAULT_CONCURRENCY_LEVELS,
        help="Concurrency levels to test (default: 10 25 50 100)"
    )
    parser.add_argument(
        "--requests-per-level", type=int, default=None,
        help="Override total requests per level (default: level * 3)"
    )
    args = parser.parse_args()

    data = asyncio.run(run_benchmark(
        base_url=args.base_url,
        levels=args.levels,
        requests_per_level=args.requests_per_level,
    ))

    print_summary(data)

    # Save results for dashboard
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"  Results saved to: {RESULTS_FILE}")
    print()

    if data.get("error"):
        sys.exit(1)


if __name__ == "__main__":
    main()
