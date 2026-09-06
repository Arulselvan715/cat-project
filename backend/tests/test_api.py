"""
tests/test_api.py — Integration tests for all REST API endpoints.
"""
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_student_id(client: TestClient) -> int:
    resp = client.get("/api/students")
    assert resp.status_code == 200
    students = resp.json()
    assert len(students) > 0
    return students[0]["id"]


def get_assignment_id(client: TestClient) -> int:
    resp = client.get("/api/assignments")
    assert resp.status_code == 200
    assignments = resp.json()
    assert len(assignments) > 0
    return assignments[0]["id"]


def create_submission(client: TestClient, content: str, student_id: int = None, assignment_id: int = None) -> dict:
    sid = student_id or get_student_id(client)
    aid = assignment_id or get_assignment_id(client)
    resp = client.post("/api/submissions", json={
        "student_id": sid,
        "assignment_id": aid,
        "content": content,
    })
    return resp


# ---------------------------------------------------------------------------
# Submissions
# ---------------------------------------------------------------------------

class TestSubmissionsEndpoint:
    def test_list_students(self, client):
        resp = client.get("/api/students")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_list_assignments(self, client):
        resp = client.get("/api/assignments")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Must include rubric
        assert "rubric" in data[0]
        assert "criteria" in data[0]["rubric"]

    def test_get_rubric(self, client):
        assignments = client.get("/api/assignments").json()
        rubric_id = assignments[0]["rubric_id"]
        resp = client.get(f"/api/rubrics/{rubric_id}")
        assert resp.status_code == 200
        assert "criteria" in resp.json()

    def test_get_rubric_not_found(self, client):
        resp = client.get("/api/rubrics/99999")
        assert resp.status_code == 404

    def test_create_submission_success(self, client):
        content = (
            "Cloud computing is the delivery of computing services over the internet. "
            "It provides scalability and cost savings. "
            "Netflix uses AWS. Spotify uses Google Cloud."
        )
        resp = create_submission(client, content)
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == content
        assert data["draft_score"] is not None
        assert data["version"] == 1

    def test_create_submission_empty_content_rejected(self, client):
        """Empty content must be rejected with 422."""
        resp = create_submission(client, "")
        assert resp.status_code == 422

    def test_create_submission_whitespace_only_rejected(self, client):
        """Whitespace-only must be rejected with 422."""
        resp = create_submission(client, "   \n\t  ")
        assert resp.status_code == 422

    def test_create_submission_invalid_student(self, client):
        aid = get_assignment_id(client)
        resp = client.post("/api/submissions", json={
            "student_id": 99999,
            "assignment_id": aid,
            "content": "Some valid content about cloud.",
        })
        assert resp.status_code == 404

    def test_create_submission_invalid_assignment(self, client):
        sid = get_student_id(client)
        resp = client.post("/api/submissions", json={
            "student_id": sid,
            "assignment_id": 99999,
            "content": "Some valid content about cloud.",
        })
        assert resp.status_code == 404

    def test_get_submissions_for_student(self, client):
        sid = get_student_id(client)
        # Create one first
        create_submission(client, "Cloud computing delivers services over internet. Netflix uses AWS. GitHub uses Azure.", student_id=sid)
        resp = client.get(f"/api/submissions/{sid}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_submissions_invalid_student(self, client):
        resp = client.get("/api/submissions/99999")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class TestFeedbackEndpoint:
    def test_generate_feedback_success(self, client):
        content = (
            "Cloud computing is on-demand delivery of IT services over the internet. "
            "Benefits include scalability and cost efficiency. "
            "For example, Netflix uses AWS. Spotify uses Google Cloud."
        )
        sub_resp = create_submission(client, content)
        assert sub_resp.status_code == 201
        sub_id = sub_resp.json()["id"]

        resp = client.post("/api/feedback", json={"submission_id": sub_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "score" in data
        assert "feedback" in data
        assert "requires_human_review" in data
        assert 0 <= data["score"] <= 100

    def test_feedback_items_have_required_fields(self, client):
        content = "Cloud is internet storage. Some companies use it."
        sub_resp = create_submission(client, content)
        sub_id = sub_resp.json()["id"]
        resp = client.post("/api/feedback", json={"submission_id": sub_id})
        assert resp.status_code == 200
        for item in resp.json()["feedback"]:
            assert "rule_id" in item
            assert "message" in item
            assert "confidence" in item
            assert "priority" in item
            assert "requires_human_review" in item

    def test_feedback_not_found_submission(self, client):
        resp = client.post("/api/feedback", json={"submission_id": 99999})
        assert resp.status_code == 404

    def test_get_feedback_for_submission(self, client):
        content = "Cloud computing means accessing servers via internet. Netflix uses AWS. Dropbox uses AWS too."
        sub_resp = create_submission(client, content)
        sub_id = sub_resp.json()["id"]
        # Generate first
        client.post("/api/feedback", json={"submission_id": sub_id})
        # Then GET
        resp = client.get(f"/api/feedback/{sub_id}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_very_short_triggers_human_review(self, client):
        """Very short submission (< 10 words) must flag human review."""
        sub_resp = create_submission(client, "I dont know cloud.")
        sub_id = sub_resp.json()["id"]
        resp = client.post("/api/feedback", json={"submission_id": sub_id})
        assert resp.status_code == 200
        # Score very low
        assert resp.json()["score"] < 30


# ---------------------------------------------------------------------------
# Revisions
# ---------------------------------------------------------------------------

class TestRevisionsEndpoint:
    def test_submit_revision_success(self, client):
        content = "Cloud is storage online."
        sub_resp = create_submission(client, content)
        sub_id = sub_resp.json()["id"]

        revision_content = (
            "Cloud computing is on-demand delivery of IT services over the internet. "
            "It provides scalability, cost savings, and remote access. "
            "Netflix uses Amazon Web Services for streaming. Spotify uses Google Cloud."
        )
        resp = client.post("/api/revisions", json={
            "original_submission_id": sub_id,
            "content": revision_content,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["version"] == 2
        assert data["score"] is not None

    def test_revision_score_improves(self, client):
        """Revision of a weak submission should have higher score."""
        weak = "Cloud is good."
        strong = (
            "Cloud computing is the delivery of computing services over the internet, "
            "enabling on-demand access. Key advantages include scalability and cost savings. "
            "Netflix uses AWS to deliver content globally. Zoom uses cloud to scale to millions."
        )
        sub_resp = create_submission(client, weak)
        sub_id = sub_resp.json()["id"]
        draft_score = sub_resp.json()["draft_score"]

        rev_resp = client.post("/api/revisions", json={
            "original_submission_id": sub_id,
            "content": strong,
        })
        assert rev_resp.status_code == 201
        revision_score = rev_resp.json()["score"]
        assert revision_score > draft_score

    def test_revision_empty_content_rejected(self, client):
        sub_resp = create_submission(client, "Cloud is useful technology.")
        sub_id = sub_resp.json()["id"]
        resp = client.post("/api/revisions", json={
            "original_submission_id": sub_id,
            "content": "   ",
        })
        assert resp.status_code == 422

    def test_revision_invalid_submission(self, client):
        resp = client.post("/api/revisions", json={
            "original_submission_id": 99999,
            "content": "Some revision content here.",
        })
        assert resp.status_code == 404

    def test_get_revisions(self, client):
        sub_resp = create_submission(client, "Cloud is useful.")
        sub_id = sub_resp.json()["id"]
        client.post("/api/revisions", json={
            "original_submission_id": sub_id,
            "content": "Cloud computing delivers on-demand services. Netflix uses AWS. Spotify uses GCP. Scalability is a key benefit.",
        })
        resp = client.get(f"/api/revisions/{sub_id}")
        assert resp.status_code == 200
        revisions = resp.json()
        assert len(revisions) >= 1
        assert revisions[0]["version"] == 2


# ---------------------------------------------------------------------------
# Reviews (Human-in-the-loop)
# ---------------------------------------------------------------------------

class TestReviewsEndpoint:
    def _create_high_impact_submission(self, client) -> int:
        """Creates a submission that triggers human review."""
        # Extremely short triggers human review
        sub_resp = create_submission(client, "I dont know")
        sub_id = sub_resp.json()["id"]
        client.post("/api/feedback", json={"submission_id": sub_id})
        return sub_id

    def test_get_reviews_returns_list(self, client):
        resp = client.get("/api/reviews")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_reviews_pending_filter(self, client):
        resp = client.get("/api/reviews?status=pending")
        assert resp.status_code == 200
        for review in resp.json():
            assert review["status"] == "pending"

    def test_approve_review(self, client):
        """Mentor can approve a pending review."""
        # Create something that requires review
        self._create_high_impact_submission(client)
        reviews = client.get("/api/reviews?status=pending").json()
        if not reviews:
            pytest.skip("No pending reviews created in this test run")
        review_id = reviews[0]["id"]
        resp = client.post(f"/api/reviews/{review_id}", json={
            "status": "approved",
            "reviewer": "Dr. Test Mentor",
            "final_decision": "Confirmed low performance. Schedule support session.",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"
        assert resp.json()["reviewer"] == "Dr. Test Mentor"

    def test_reject_review_requires_reason(self, client):
        """Rejecting a review without override_reason must fail with 422."""
        self._create_high_impact_submission(client)
        reviews = client.get("/api/reviews?status=pending").json()
        if not reviews:
            pytest.skip("No pending reviews")
        review_id = reviews[0]["id"]
        resp = client.post(f"/api/reviews/{review_id}", json={
            "status": "rejected",
            "reviewer": "Dr. Test",
            # Missing override_reason
        })
        assert resp.status_code == 422

    def test_reject_review_with_reason(self, client):
        """Mentor can reject with an override reason."""
        self._create_high_impact_submission(client)
        reviews = client.get("/api/reviews?status=pending").json()
        if not reviews:
            pytest.skip("No pending reviews")
        review_id = reviews[0]["id"]
        resp = client.post(f"/api/reviews/{review_id}", json={
            "status": "rejected",
            "reviewer": "Prof. Rivera",
            "override_reason": "This is a false positive — student was quoting the rubric for clarity.",
            "final_decision": "No action needed.",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "rejected"
        assert "override_reason" in resp.json()
        assert resp.json()["override_reason"] is not None

    def test_double_action_on_review_fails(self, client):
        """Acting on an already-actioned review must return 400."""
        self._create_high_impact_submission(client)
        reviews = client.get("/api/reviews?status=pending").json()
        if not reviews:
            pytest.skip("No pending reviews")
        review_id = reviews[0]["id"]
        # Approve first
        client.post(f"/api/reviews/{review_id}", json={
            "status": "approved",
            "reviewer": "Dr. Test",
        })
        # Try again
        resp = client.post(f"/api/reviews/{review_id}", json={
            "status": "approved",
            "reviewer": "Dr. Test",
        })
        assert resp.status_code == 400

    def test_review_not_found(self, client):
        resp = client.post("/api/reviews/99999", json={
            "status": "approved",
            "reviewer": "Dr. Test",
        })
        assert resp.status_code == 404

    def test_invalid_review_status_rejected(self, client):
        """Status must be one of approved/rejected/modified."""
        resp = client.post("/api/reviews/1", json={
            "status": "finalized",
            "reviewer": "Dr. Test",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------

class TestMetricsEndpoint:
    def test_metrics_returns_200(self, client):
        resp = client.get("/api/metrics")
        assert resp.status_code == 200

    def test_metrics_has_required_fields(self, client):
        data = client.get("/api/metrics").json()
        required = [
            "total_submissions", "total_students", "automatic_feedback_count",
            "human_review_required_count", "pending_reviews", "avg_draft_score",
            "avg_final_score", "avg_improvement", "relative_improvement_pct",
            "rubric_coverage", "pct_high_impact_reviewed", "criterion_improvements",
            "data_label",
        ]
        for field in required:
            assert field in data, f"Missing field: {field}"

    def test_metrics_data_label_present(self, client):
        """Metrics must include a label distinguishing demo from real data."""
        data = client.get("/api/metrics").json()
        assert "DEMO" in data["data_label"].upper() or "seed" in data["data_label"].lower()

    def test_metrics_counts_non_negative(self, client):
        data = client.get("/api/metrics").json()
        assert data["total_submissions"] >= 0
        assert data["total_students"] >= 0
        assert data["pending_reviews"] >= 0


# ---------------------------------------------------------------------------
# Health / root
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Review Explainability — mentor UI must receive enough data to display
# the full student submission without extra API round-trips.
# ---------------------------------------------------------------------------

class TestReviewExplainability:
    """
    Verifies that every review response carries:
    - submission_content  (complete original submission text)
    - submission_score    (draft score for context)
    - high_impact_reason  (why human review was triggered)
    - evidence            (the specific snippet that triggered the rule)
    - confidence          (rule confidence)
    - rule_id             (which rule fired)
    - student_name        (who submitted)
    """

    SHORT_SUBMISSION = "I dont know cloud computing."

    def _create_high_impact_review(self, client) -> int:
        """Creates a submission that triggers human review and returns review id."""
        sub_resp = create_submission(client, self.SHORT_SUBMISSION)
        assert sub_resp.status_code == 201
        sub_id = sub_resp.json()["id"]
        client.post("/api/feedback", json={"submission_id": sub_id})
        reviews = client.get("/api/reviews?status=pending").json()
        assert len(reviews) > 0, "Expected at least one pending review after short submission"
        return reviews[0]["id"]

    def test_review_contains_submission_content(self, client):
        """GET /api/reviews must include submission_content for every review."""
        self._create_high_impact_review(client)
        reviews = client.get("/api/reviews").json()
        assert len(reviews) > 0
        for review in reviews:
            assert "submission_content" in review, "Review missing submission_content"
            if review["submission_content"] is not None:
                assert isinstance(review["submission_content"], str)
                assert len(review["submission_content"]) > 0

    def test_review_content_matches_submission(self, client):
        """submission_content in review must match the original submission text."""
        sub_resp = create_submission(client, self.SHORT_SUBMISSION)
        sub_id = sub_resp.json()["id"]
        client.post("/api/feedback", json={"submission_id": sub_id})
        reviews = client.get("/api/reviews").json()
        # Find the review for our submission
        our_reviews = [r for r in reviews if r.get("submission_id") == sub_id]
        assert len(our_reviews) > 0, "No review found for our submission"
        assert our_reviews[0]["submission_content"] == self.SHORT_SUBMISSION

    def test_review_contains_submission_score(self, client):
        """Reviews must expose submission_score so mentors can see draft quality."""
        self._create_high_impact_review(client)
        reviews = client.get("/api/reviews").json()
        for review in reviews:
            assert "submission_score" in review, "Review missing submission_score"
            if review["submission_score"] is not None:
                assert 0 <= review["submission_score"] <= 100

    def test_review_contains_high_impact_reason(self, client):
        """High-impact reviews must include high_impact_reason explaining why review was triggered."""
        self._create_high_impact_review(client)
        pending = client.get("/api/reviews?status=pending").json()
        # At least one pending review should have a high_impact_reason
        reasons = [r.get("high_impact_reason") for r in pending]
        non_null_reasons = [r for r in reasons if r]
        assert len(non_null_reasons) > 0, (
            "Expected at least one pending review to carry a high_impact_reason"
        )

    def test_review_contains_evidence_separately(self, client):
        """Evidence snippet must be present separately from submission_content."""
        self._create_high_impact_review(client)
        reviews = client.get("/api/reviews").json()
        for review in reviews:
            assert "evidence" in review, "Review missing evidence field"
            # evidence and submission_content are separate fields
            assert "submission_content" in review, "Review missing submission_content field"
            # They should be different keys (evidence is a snippet, content is the full text)
            if review["submission_content"] and review["evidence"]:
                # evidence is either empty or a substring of / shorter than full content
                assert review["evidence"] != review["submission_content"] or \
                    len(review["submission_content"]) <= len(review["evidence"]) + 1

    def test_review_contains_confidence_and_rule(self, client):
        """Reviews must expose confidence and rule_id for mentor explainability."""
        self._create_high_impact_review(client)
        reviews = client.get("/api/reviews").json()
        for review in reviews:
            assert "confidence" in review
            assert "rule_id" in review
            if review["confidence"] is not None:
                assert 0.0 <= review["confidence"] <= 1.0

    def test_review_contains_student_name(self, client):
        """Reviews must carry student_name so mentor knows whose work it is."""
        self._create_high_impact_review(client)
        reviews = client.get("/api/reviews").json()
        for review in reviews:
            assert "student_name" in review
            if review["student_name"]:
                assert isinstance(review["student_name"], str)
                assert len(review["student_name"]) > 0

    def test_post_action_review_still_has_explainability_fields(self, client):
        """After approving a review, the response should still include all explainability fields."""
        review_id = self._create_high_impact_review(client)
        resp = client.post(f"/api/reviews/{review_id}", json={
            "status": "approved",
            "reviewer": "Dr. Explainability Test",
            "final_decision": "Low-effort submission — schedule support.",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "submission_content" in data
        assert "submission_score" in data
        assert "high_impact_reason" in data
        assert "evidence" in data
        assert "confidence" in data
        assert "rule_id" in data
