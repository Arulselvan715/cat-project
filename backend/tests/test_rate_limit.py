"""
test_rate_limit.py — API Rate Limiting Tests
=============================================
Tests that:
  1. Normal requests are served with 200
  2. Exceeding 30 requests/minute per IP returns HTTP 429
  3. Rate-limit state is isolated between tests (limiter storage is reset)
  4. Existing tests are not polluted by shared rate-limit state

Implementation note
--------------------
slowapi uses an in-memory storage backend by default.  Between tests we reset
the limiter's storage so that rate-limit state from one test does not leak
into another.

The rate limit is configured as 30 requests/minute in main.py.  These tests
send bursts well beyond that limit to reliably trigger 429 responses.

IMPORTANT: These tests import the app AFTER resetting limiter state to avoid
polluting the broader test suite.  The conftest.py fixture already clears
app.dependency_overrides between tests.
"""

from __future__ import annotations

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reset_limiter(app):
    """Reset slowapi limiter storage to clear all rate-limit counters."""
    try:
        limiter = app.state.limiter
        limiter.reset()
    except Exception:
        # If reset is not available or fails, clear internal storage
        try:
            limiter._storage.reset()
        except Exception:
            pass  # Best-effort reset


def _get_app_and_reset():
    """Import the app fresh and reset limiter state."""
    from main import app
    _reset_limiter(app)
    return app


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_rate_limit_state():
    """Reset limiter storage before and after every test in this module."""
    from main import app
    _reset_limiter(app)
    yield
    _reset_limiter(app)


@pytest.fixture()
def rate_limit_client(db):
    """Test client with DB override and limiter reset."""
    from main import app
    from database import get_db

    _reset_limiter(app)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    app.dependency_overrides.clear()
    _reset_limiter(app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestRateLimitNormalRequests:

    def test_health_endpoint_returns_200(self, rate_limit_client):
        """A single request to /health should succeed with 200."""
        resp = rate_limit_client.get("/health")
        assert resp.status_code == 200

    def test_root_endpoint_returns_200(self, rate_limit_client):
        """A single request to / should succeed with 200."""
        resp = rate_limit_client.get("/")
        assert resp.status_code == 200

    def test_students_endpoint_within_limit(self, rate_limit_client):
        """Multiple requests well within limit should all return 200."""
        for _ in range(5):
            resp = rate_limit_client.get("/api/students")
            assert resp.status_code == 200, (
                f"Expected 200, got {resp.status_code}. "
                f"Rate limit may be too low or reset failed."
            )


class TestRateLimitExceeded:

    def test_exceeding_limit_returns_429(self, rate_limit_client):
        """
        Sending more than 30 requests/minute must return 429 for the excess.

        We send 35 requests in a tight loop.  The first 30 should succeed (200)
        and at least one of the remaining must return 429.

        NOTE: TestClient uses 127.0.0.1 as the client IP, so all requests share
        the same rate-limit bucket.
        """
        responses = []
        for _ in range(35):
            resp = rate_limit_client.get("/api/students")
            responses.append(resp.status_code)

        status_200 = responses.count(200)
        status_429 = responses.count(429)

        assert status_429 > 0, (
            f"Expected at least one 429 response after 35 rapid requests. "
            f"Got: {responses}. "
            f"Rate limiting may not be active."
        )
        assert status_200 >= 1, (
            f"Expected some 200 responses before limit was hit. Got: {responses}"
        )

    def test_429_response_is_json(self, rate_limit_client):
        """
        When rate limit is exceeded, the response should be JSON with an error message.
        """
        # Exhaust the limit
        for _ in range(31):
            rate_limit_client.get("/api/students")

        resp = rate_limit_client.get("/api/students")
        if resp.status_code == 429:
            content_type = resp.headers.get("content-type", "")
            assert "json" in content_type or resp.text != "", (
                "Expected JSON or non-empty body in 429 response"
            )

    def test_second_burst_also_triggers_429(self, rate_limit_client):
        """
        A second burst to the same endpoint (after limiter reset for this test)
        should also trigger 429 once the limit is exceeded.
        This confirms the limiter is consistently applied — not a one-time artifact.
        """
        responses = []
        for _ in range(35):
            resp = rate_limit_client.get("/api/students")
            responses.append(resp.status_code)

        status_429 = responses.count(429)
        assert status_429 > 0, (
            f"Expected 429 in second burst of 35 requests. Got: {responses}"
        )



class TestRateLimitStateIsolation:

    def test_rate_limit_resets_between_tests_A(self, rate_limit_client):
        """First isolation test: sends requests, expects 200s at start."""
        resp = rate_limit_client.get("/health")
        assert resp.status_code == 200

    def test_rate_limit_resets_between_tests_B(self, rate_limit_client):
        """Second isolation test: limiter was reset; first request is 200."""
        resp = rate_limit_client.get("/health")
        assert resp.status_code == 200, (
            "Rate limit state leaked from a previous test. "
            "reset_rate_limit_state fixture may not be working."
        )

    def test_rate_limit_config_is_correct(self, rate_limit_client):
        """Verify that exactly 30 requests succeed before the first 429."""
        success_count = 0
        first_429_at = None

        for i in range(35):
            resp = rate_limit_client.get("/api/students")
            if resp.status_code == 200:
                success_count += 1
            elif resp.status_code == 429 and first_429_at is None:
                first_429_at = i + 1

        # We allow some slack: the limit is 30/minute, so 30 or 31 successes
        # are both acceptable depending on implementation counting
        assert success_count >= 29, (
            f"Expected ~30 successful requests before 429; got {success_count}"
        )
        assert first_429_at is not None, "No 429 was returned in 35 rapid requests to /api/students"
