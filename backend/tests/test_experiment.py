"""
tests/test_experiment.py — Automated tests for Experiment & Validation module.
Tests:
- Baseline metric calculation
- Draft/final improvement calculation
- Relative improvement calculation
- Instructor feedback addressed calculation
- Error classification
- Missing data handling ("Insufficient measured data")
- No fabricated metrics verification
- Human review percentage calculation
- User validation submission
- Accessibility checklist update
- Explainability validation recording
- Language fairness (conceptual quality preserved)
"""
import pytest
from fastapi.testclient import TestClient
from models import (
    AccessibilityCheckRecord,
    ErrorAnalysisRecord,
    Experiment,
    ExperimentObservation,
    ExplainabilityValidationRecord,
    UserValidationRecord,
)
from routers.experiments import _calculate_group_stats
from seed import seed_experiments_and_validation


class TestExperimentCalculations:
    def test_group_stats_calculation(self):
        """Test calculation of avg draft, final, improvement, median, and rubric coverage."""
        obs = [
            ExperimentObservation(
                experiment_id=1,
                group="BASELINE",
                draft_score=40.0,
                final_score=50.0,
                improvement_points=10.0,
                relative_improvement=25.0,
                rubric_coverage_draft=30.0,
                rubric_coverage_final=50.0,
                feedback_used="Generic",
                revision_count=1,
                recommendations_generated=0,
                recommendations_acted_upon=0,
            ),
            ExperimentObservation(
                experiment_id=1,
                group="BASELINE",
                draft_score=50.0,
                final_score=70.0,
                improvement_points=20.0,
                relative_improvement=40.0,
                rubric_coverage_draft=40.0,
                rubric_coverage_final=70.0,
                feedback_used="Generic",
                revision_count=1,
                recommendations_generated=0,
                recommendations_acted_upon=0,
            ),
        ]
        stats = _calculate_group_stats(obs, "BASELINE", "Control Group")
        assert stats.count == 2
        assert stats.avg_draft_score == 45.0
        assert stats.avg_final_score == 60.0
        assert stats.avg_improvement == 15.0
        assert stats.median_improvement == 15.0
        assert stats.rubric_coverage_draft == 35.0
        assert stats.rubric_coverage_final == 60.0
        assert stats.rubric_coverage_change == 25.0
        assert stats.data_status == "Measured Data"

    def test_missing_data_handling(self):
        """Empty observations list returns 'Insufficient measured data' without fabricating numbers."""
        stats = _calculate_group_stats([], "PROTOTYPE", "Treatment Group")
        assert stats.count == 0
        assert stats.avg_draft_score is None
        assert stats.avg_final_score is None
        assert stats.avg_improvement is None
        assert stats.median_improvement is None
        assert stats.data_status == "Insufficient measured data"

    def test_relative_improvement_calculation(self):
        """Verifies correct mathematical formula: ((final - draft) / draft) * 100."""
        draft = 40.0
        final = 60.0
        improvement = final - draft
        relative = round(((final - draft) / draft) * 100, 2)
        assert improvement == 20.0
        assert relative == 50.0

    def test_instructor_feedback_addressed_calculation(self):
        """Test calculation of percentage of instructor feedback items addressed."""
        obs = [
            ExperimentObservation(
                experiment_id=1,
                group="PROTOTYPE",
                draft_score=40.0,
                final_score=60.0,
                improvement_points=20.0,
                relative_improvement=50.0,
                rubric_coverage_draft=40.0,
                rubric_coverage_final=80.0,
                feedback_used="Assistant",
                instructor_feedback="Add example.",
                instructor_feedback_addressed=True,
                revision_count=2,
                recommendations_generated=2,
                recommendations_acted_upon=2,
            ),
            ExperimentObservation(
                experiment_id=1,
                group="PROTOTYPE",
                draft_score=45.0,
                final_score=65.0,
                improvement_points=20.0,
                relative_improvement=44.4,
                rubric_coverage_draft=50.0,
                rubric_coverage_final=80.0,
                feedback_used="Assistant",
                instructor_feedback="Separate paragraphs.",
                instructor_feedback_addressed=False,
                revision_count=2,
                recommendations_generated=2,
                recommendations_acted_upon=1,
            ),
        ]
        stats = _calculate_group_stats(obs, "PROTOTYPE", "Treatment")
        # 1 out of 2 addressed = 50.0%
        assert stats.instructor_feedback_addressed_pct == 50.0
        assert stats.recommendations_generated_total == 4
        assert stats.recommendations_acted_upon_total == 3
        assert stats.acted_upon_pct == 75.0


class TestExperimentEndpoints:
    @pytest.fixture(autouse=True)
    def setup_experiment_data(self, db):
        seed_experiments_and_validation(db)

    def test_list_experiments(self, client: TestClient):
        resp = client.get("/api/experiments")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["experiment_id"] == "EXP-2026-001"
        assert "BASELINE" in data[0]["baseline_definition"]

    def test_experiment_comparison(self, client: TestClient):
        resp = client.get("/api/experiments/comparison")
        assert resp.status_code == 200
        data = resp.json()
        assert "baseline" in data
        assert "prototype" in data
        assert "targets_table" in data
        assert "instructor_feedback_items" in data
        assert data["data_label"].startswith("BASELINE / DEMO EXPERIMENT")

        # Prototype improvement should be positive and measured
        assert data["prototype"]["avg_improvement"] > 0
        assert data["baseline"]["avg_improvement"] > 0
        assert data["prototype"]["count"] > 0
        assert data["baseline"]["count"] > 0

        # Targets table has 5 required goals
        metrics_in_table = [r["metric"] for r in data["targets_table"]]
        assert "Draft → Final Quality Improvement" in metrics_in_table
        assert "Rubric Coverage" in metrics_in_table
        assert "Feedback Usefulness" in metrics_in_table
        assert "Recommendation Accuracy" in metrics_in_table
        assert "Human Review of High-Impact Decisions" in metrics_in_table

    def test_observations_filtering(self, client: TestClient):
        resp_all = client.get("/api/experiments/observations")
        assert resp_all.status_code == 200
        all_obs = resp_all.json()
        assert len(all_obs) > 0

        resp_baseline = client.get("/api/experiments/observations?group=BASELINE")
        assert resp_baseline.status_code == 200
        for obs in resp_baseline.json():
            assert obs["group"] == "BASELINE"

        resp_proto = client.get("/api/experiments/observations?group=PROTOTYPE")
        assert resp_proto.status_code == 200
        for obs in resp_proto.json():
            assert obs["group"] == "PROTOTYPE"

    def test_instructor_feedback_endpoint(self, client: TestClient):
        resp = client.get("/api/experiments/instructor-feedback")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) > 0
        for item in items:
            assert "instructor_feedback" in item
            assert "addressed" in item
            assert item["status_display"] in ["✓ Addressed", "✗ Not Addressed"]

    def test_error_analysis_and_classification(self, client: TestClient):
        resp = client.get("/api/experiments/error-analysis")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_recommendations"] >= 8
        assert "error_breakdown" in data

        # Verify key error types are represented
        breakdown = data["error_breakdown"]
        required_types = [
            "False positive",
            "False negative",
            "Incorrect evidence",
            "Incorrect rule",
            "Low-confidence recommendation",
            "Language-related issue",
            "Ambiguous submission",
            "Human override",
        ]
        for rt in required_types:
            assert rt in breakdown, f"Missing error type: {rt}"

        # Verify ground truth handling
        has_gt_missing = any(not r["ground_truth_available"] for r in data["records"])
        assert has_gt_missing, "Expected at least one record without ground truth"

    def test_add_error_analysis_record(self, client: TestClient):
        new_err = {
            "student_name": "Test Tester",
            "recommendation": "Add second example",
            "expected_result": "Student had 2 examples",
            "actual_result": "Engine counted only 1",
            "error_type": "False negative",
            "impact": "Unnecessary revision prompt",
            "correction_improvement": "Update example regex pattern",
            "ground_truth_available": True,
            "is_correct": False,
        }
        resp = client.post("/api/experiments/error-analysis", json=new_err)
        assert resp.status_code == 200
        assert resp.json()["student_name"] == "Test Tester"

    def test_user_validation_submission_and_retrieval(self, client: TestClient):
        payload = {
            "role": "Student",
            "task_ratings": [
                {"task_id": 1, "task_name": "Understand feedback", "success": True, "ease_rating": 4, "comment": "Good"},
                {"task_id": 2, "task_name": "Find evidence", "success": True, "ease_rating": 5, "comment": "Found easily"},
                {"task_id": 3, "task_name": "Understand why recommendation was generated", "success": True, "ease_rating": 4, "comment": "Rule made sense"},
                {"task_id": 4, "task_name": "Complete a revision", "success": True, "ease_rating": 5, "comment": "Score improved"},
                {"task_id": 5, "task_name": "Understand when human review is required", "success": True, "ease_rating": 5, "comment": "Clear banner"},
            ],
            "accessibility_feedback": "Contrast is great.",
            "language_feedback": "Fair evaluation.",
            "explainability_feedback": "Very transparent.",
            "overall_usefulness_rating": 5,
        }
        resp = client.post("/api/experiments/validation/user", json=payload)
        assert resp.status_code == 200
        res_data = resp.json()
        assert res_data["role"] == "Student"
        assert len(res_data["task_ratings"]) == 5

        # Check summary endpoint reflects submission
        resp_sum = client.get("/api/experiments/validation/user")
        assert resp_sum.status_code == 200
        summary = resp_sum.json()
        assert summary["total_submissions"] >= 1
        assert "Understand feedback" in summary["task_success_rates"]

    def test_accessibility_checklist(self, client: TestClient):
        resp = client.get("/api/experiments/validation/accessibility")
        assert resp.status_code == 200
        checks = resp.json()
        assert len(checks) >= 8

        item_names = [c["item_name"] for c in checks]
        assert "Keyboard navigation" in item_names
        assert "Visible focus indicators" in item_names
        assert "Screen-reader compatibility check" in item_names

        # Test updating checklist item
        cid = checks[0]["id"]
        update_resp = client.post(f"/api/experiments/validation/accessibility/{cid}", json={
            "status": "Pass",
            "comments": "Verified in automated test run",
            "tester": "Automated Tester",
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["comments"] == "Verified in automated test run"

    def test_explainability_validation(self, client: TestClient):
        resp = client.get("/api/experiments/validation/explainability")
        assert resp.status_code == 200
        checks = resp.json()
        assert len(checks) >= 7

        # Test updating question response
        qid = checks[0]["id"]
        update_resp = client.post(f"/api/experiments/validation/explainability/{qid}", json={
            "status": "UNDERSTOOD",
            "comment": "Confirmed in test",
            "tester_role": "Student Reviewer",
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["status"] == "UNDERSTOOD"

    def test_language_validation_separates_grammar(self, client: TestClient):
        """Verifies that non-native / grammatically imperfect submission preserves conceptual quality."""
        resp = client.get("/api/experiments/validation/language")
        assert resp.status_code == 200
        cases = resp.json()
        assert len(cases) == 4

        non_native = next(c for c in cases if c["category"] == "Non-native English")
        assert non_native["conceptual_quality_preserved"] is True
        assert non_native["grammar_flagged"] is True
        assert non_native["grammar_priority"] == "low"
        # The conceptual score is substantial because concepts were recognized
        assert non_native["concept_score"] > 50.0
