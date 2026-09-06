"""
tests/conftest.py — Shared fixtures for the test suite.
Uses an in-memory SQLite database so tests are isolated and fast.
"""
import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from models import Assignment, Rubric, RubricCriterion, Student
import json


TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture(scope="function")
def db(engine):
    """Per-test fresh database session."""
    connection = engine.connect()
    transaction = connection.begin()
    TestSession = sessionmaker(bind=connection)
    session = TestSession()

    # Seed minimal rubric and assignment for tests
    rubric = Rubric(name="Test Rubric", description="Test")
    session.add(rubric)
    session.flush()

    criteria_data = [
        ("DEF", "Definition", "Define cloud computing", 0.20),
        ("ADV", "Advantages", "List advantages", 0.30),
        ("EX",  "Examples", "Give examples", 0.30),
        ("ORG", "Organization", "Organize well", 0.10),
        ("CLR", "Clarity", "Be clear", 0.10),
    ]
    for cid, name, desc, weight in criteria_data:
        c = RubricCriterion(
            rubric_id=rubric.id,
            criterion_id=cid,
            name=name,
            description=desc,
            weight=weight,
            min_conditions="[]",
            rules="[]",
        )
        session.add(c)

    assignment = Assignment(
        title="Test Assignment",
        description="Test description",
        rubric_id=rubric.id,
    )
    session.add(assignment)

    student = Student(name="Test Student", email="test@example.edu")
    session.add(student)
    session.flush()
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Test client with overridden DB dependency."""
    from main import app

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
