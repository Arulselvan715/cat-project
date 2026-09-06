"""
seed.py
=======
Populates the database with:
- 1 rubric with 5 criteria
- 1 assignment
- 10 students
- 22 realistic seed submissions covering all categories
- Pre-generated feedback and mentor reviews

ALL DATA IS DEMO DATA — clearly labeled.
Do not represent these as measured experimental results.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from feedback_engine import analyze_submission
from models import (
    AccessibilityCheckRecord, Assignment, ErrorAnalysisRecord,
    Experiment, ExperimentObservation, ExplainabilityValidationRecord,
    FeedbackItem, OverrideReason, Review, Revision,
    Rubric, RubricCriterion, Student, Submission, UserValidationRecord,
)


# ---------------------------------------------------------------------------
# Rubric definition
# ---------------------------------------------------------------------------

RUBRIC_CRITERIA = [
    {
        "criterion_id": "DEF",
        "name": "Definition of Cloud Computing",
        "description": "The student clearly defines cloud computing, explaining what it is and how it works.",
        "weight": 0.20,
        "min_conditions": json.dumps([
            {"condition": "submission contains a definition of cloud computing", "required": True}
        ]),
        "rules": json.dumps([
            {"rule_id": "RULE_DEF_001", "description": "If no definition present, recommend adding one."},
            {"rule_id": "RULE_DEF_001B", "description": "If definition is very brief, recommend expanding."}
        ]),
    },
    {
        "criterion_id": "ADV",
        "name": "Advantages of Cloud Computing",
        "description": "The student discusses at least two distinct advantages with explanation.",
        "weight": 0.30,
        "min_conditions": json.dumps([
            {"condition": "at least 2 distinct advantages mentioned", "required": True}
        ]),
        "rules": json.dumps([
            {"rule_id": "RULE_ADV_001", "description": "If fewer than 2 advantages, recommend adding more."},
            {"rule_id": "RULE_ADV_002", "description": "If advantages are not explained, recommend elaboration."}
        ]),
    },
    {
        "criterion_id": "EX",
        "name": "Real-World Examples",
        "description": "The student provides at least two specific real-world examples of cloud computing in use.",
        "weight": 0.30,
        "min_conditions": json.dumps([
            {"condition": "at least 2 real-world examples", "required": True}
        ]),
        "rules": json.dumps([
            {"rule_id": "RULE_EX_001", "description": "If fewer than 2 examples, recommend adding more."},
            {"rule_id": "RULE_EX_002", "description": "If examples not linked to advantages, recommend connecting them."},
            {"rule_id": "RULE_EX_003", "description": "If example is ambiguous, flag for human review."}
        ]),
    },
    {
        "criterion_id": "ORG",
        "name": "Organization & Structure",
        "description": "The response is logically organized with clear paragraphs and flow.",
        "weight": 0.10,
        "min_conditions": json.dumps([
            {"condition": "clear paragraph structure with transitions", "required": False}
        ]),
        "rules": json.dumps([
            {"rule_id": "RULE_ORG_001", "description": "If no structure detected, recommend organizing."}
        ]),
    },
    {
        "criterion_id": "CLR",
        "name": "Clarity & Language",
        "description": "The response is clear and readable. Grammar is considered informational only — non-native English speakers are not penalized for imperfect grammar if concepts are correct.",
        "weight": 0.10,
        "min_conditions": json.dumps([]),
        "rules": json.dumps([
            {"rule_id": "RULE_CLR_001", "description": "If submission too short, flag."},
            {"rule_id": "RULE_LANG_001", "description": "If grammar issues, note informally without reducing concept score."}
        ]),
    },
]

# ---------------------------------------------------------------------------
# Seed students
# ---------------------------------------------------------------------------

STUDENTS = [
    {"name": "Alice Johnson",       "email": "alice@example.edu"},
    {"name": "Bob Smith",           "email": "bob@example.edu"},
    {"name": "Carla Mendes",        "email": "carla@example.edu"},    # non-native English
    {"name": "David Chen",          "email": "david@example.edu"},
    {"name": "Elan Goldberg",       "email": "elan@example.edu"},
    {"name": "Fatima Al-Hassan",    "email": "fatima@example.edu"},   # non-native English
    {"name": "George Osei",         "email": "george@example.edu"},
    {"name": "Hannah Park",         "email": "hannah@example.edu"},
    {"name": "Ivan Petrov",         "email": "ivan@example.edu"},     # non-native English
    {"name": "Julia Martinez",      "email": "julia@example.edu"},
]

# ---------------------------------------------------------------------------
# Submission corpus — 22 submissions across all categories
# ---------------------------------------------------------------------------

SUBMISSIONS = [
    # -------------------------------------------------------------------------
    # STRONG submissions (score ~80-95)
    # -------------------------------------------------------------------------
    {
        "student_idx": 0,  # Alice
        "category": "strong",
        "content": (
            "Cloud computing refers to the delivery of computing services—including servers, "
            "storage, databases, networking, software, and analytics—over the internet (the cloud) "
            "to offer faster innovation, flexible resources, and economies of scale.\n\n"
            "One of the primary advantages of cloud computing is scalability. Businesses can "
            "quickly scale their IT resources up or down depending on demand, without the need to "
            "invest in physical hardware. For example, an e-commerce site can scale its servers "
            "during the holiday season and scale back afterward.\n\n"
            "Another key advantage is cost savings. Organizations pay only for the resources they "
            "use, eliminating large upfront capital expenditures. This pay-as-you-go model is "
            "particularly beneficial for startups and small businesses.\n\n"
            "Real-world examples include Netflix, which uses Amazon Web Services (AWS) to stream "
            "content to over 200 million subscribers worldwide, and Spotify, which relies on "
            "Google Cloud to deliver music and podcasts to millions of users in real time.\n\n"
            "In conclusion, cloud computing provides significant advantages in scalability, cost "
            "efficiency, and reliability, making it an essential technology for modern businesses."
        ),
        "draft_score": 91.0,
        "has_revision": False,
    },
    {
        "student_idx": 3,  # David
        "category": "strong",
        "content": (
            "Cloud computing is defined as internet-based computing where shared resources, "
            "software, and information are provided to computers and other devices on demand. "
            "It is a model for enabling on-demand network access to a shared pool of configurable "
            "computing resources.\n\n"
            "The first major advantage is flexibility and remote access. Employees can access "
            "company data and applications from anywhere with an internet connection, which "
            "dramatically improves collaboration across geographically distributed teams. "
            "Furthermore, cloud providers offer disaster recovery solutions, ensuring business "
            "continuity even when local infrastructure fails.\n\n"
            "Secondly, cloud computing offers significant cost reduction. Companies no longer "
            "need to maintain on-premises servers, reducing capital expenditure and IT staff costs. "
            "Moreover, the ability to scale resources eliminates the waste of over-provisioning.\n\n"
            "For example, Zoom uses AWS and Oracle Cloud to handle its massive video conferencing "
            "infrastructure, serving millions of concurrent users daily. Similarly, Slack relies "
            "on AWS for its messaging platform, which must be highly available and performant.\n\n"
            "In summary, cloud computing enhances organizational agility, reduces cost, and "
            "enables reliable services at global scale."
        ),
        "draft_score": 88.0,
        "has_revision": False,
    },
    # -------------------------------------------------------------------------
    # WEAK submissions (score ~25-45)
    # -------------------------------------------------------------------------
    {
        "student_idx": 1,  # Bob
        "category": "weak",
        "content": (
            "Cloud is when you store stuff online. It is good because it is cheap and fast. "
            "Some companies use it."
        ),
        "draft_score": None,
        "has_revision": True,
        "revision_content": (
            "Cloud computing is a way to access computing resources like storage, servers, "
            "and software over the internet instead of on local hardware.\n\n"
            "One advantage is cost savings — companies pay only for what they use rather than "
            "buying expensive servers. Another advantage is scalability — you can increase or "
            "decrease resources quickly based on demand.\n\n"
            "For example, Netflix uses Amazon Web Services to deliver streaming video to hundreds "
            "of millions of subscribers. GitHub uses cloud infrastructure to host millions of "
            "code repositories and serve developers worldwide.\n\n"
            "In conclusion, cloud computing offers flexible, cost-effective computing for "
            "businesses of all sizes."
        ),
        "revision_score": 74.0,
    },
    {
        "student_idx": 4,  # Elan
        "category": "weak",
        "content": (
            "Cloud computing has many benefits. It helps businesses save money and be more "
            "efficient. Many big companies use cloud services today. The technology keeps getting "
            "better and more people are adopting it."
        ),
        "draft_score": None,
        "has_revision": True,
        "revision_content": (
            "Cloud computing refers to the on-demand delivery of IT resources over the internet "
            "with pay-as-you-go pricing.\n\n"
            "A major advantage is scalability: companies like Amazon and Google can increase "
            "server capacity instantly during peak demand. Another advantage is cost reduction: "
            "startups avoid large upfront hardware costs.\n\n"
            "Real-world examples: Dropbox uses AWS to store and sync files for millions of users. "
            "Salesforce delivers CRM software entirely over the cloud, used by over 150,000 "
            "businesses worldwide.\n\n"
            "Overall, cloud computing enables agility and efficiency at scale."
        ),
        "revision_score": 77.0,
    },
    # -------------------------------------------------------------------------
    # INCOMPLETE / very short submissions
    # -------------------------------------------------------------------------
    {
        "student_idx": 6,  # George
        "category": "incomplete",
        "content": "Cloud is internet storage.",
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 7,  # Hannah
        "category": "incomplete",
        "content": (
            "Cloud computing is when data is stored on remote servers. It is cheaper than "
            "buying your own servers."
        ),
        "draft_score": None,
        "has_revision": True,
        "revision_content": (
            "Cloud computing is the delivery of computing services—servers, storage, databases, "
            "and more—over the internet.\n\n"
            "Advantages include: (1) Cost savings — no need for upfront hardware investment; "
            "(2) Scalability — services can grow with your business.\n\n"
            "Example 1: Netflix uses AWS to stream content to over 200 million users. "
            "Example 2: Spotify uses Google Cloud to process music recommendations in real time.\n\n"
            "Cloud computing is transforming how businesses operate globally."
        ),
        "revision_score": 79.0,
    },
    # -------------------------------------------------------------------------
    # NON-NATIVE ENGLISH — correct concepts, imperfect grammar
    # -------------------------------------------------------------------------
    {
        "student_idx": 2,  # Carla (Portuguese native)
        "category": "non_native_english",
        "content": (
            "Cloud computing it is a technology that allow companies to using server and storage "
            "over internet instead of having local hardware.\n\n"
            "The advantage of cloud is many. First, it have scalability which mean company can "
            "increase resource when they need more. Second, it is cost effective because you "
            "don't buy hardware expensive.\n\n"
            "For example, Amazon using AWS for they own e-commerce platform. Also Netflix it is "
            "using cloud to streaming videos to millions peoples around the world.\n\n"
            "In conclusion, cloud computing it is very important for modern businesses because "
            "give flexibility and saving cost."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 5,  # Fatima (Arabic native)
        "category": "non_native_english",
        "content": (
            "The cloud computing is new technology that is very useful for companies and "
            "organizations.\n\n"
            "Cloud computing it means access to computing resources through internet. "
            "Companies they use cloud because it give many benefit.\n\n"
            "The first benefit is flexibility, employee can access file from anywhere with "
            "internet connection. The second benefit it is cost saving because company not "
            "need buy server.\n\n"
            "Real world example is Zoom platform. They use AWS for their video service. "
            "Also Dropbox it is using Amazon cloud for store files of users.\n\n"
            "So cloud computing it is good for all type of business."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 8,  # Ivan (Russian native)
        "category": "non_native_english",
        "content": (
            "Cloud computing — this is technology when computing services is delivering via "
            "internet. Is including servers, storages, databases, networking.\n\n"
            "Advantages of cloud computing is: scalability, when company can make bigger or "
            "smaller IT resources; cost efficiency, when not needed to buy hardware; and also "
            "remote access, when worker can to work from different places.\n\n"
            "Example in real world: GitHub — the platform for code is using cloud for host "
            "repositories of developers. Spotify — music service is using Google Cloud for "
            "recommendations and delivering content.\n\n"
            "Conclusion: cloud is important technology for modern companies, giving flexibility "
            "and reducing costs."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    # -------------------------------------------------------------------------
    # AMBIGUOUS — has content but unclear/borderline examples
    # -------------------------------------------------------------------------
    {
        "student_idx": 9,  # Julia
        "category": "ambiguous",
        "content": (
            "Cloud computing means accessing services through the internet. "
            "The main benefits are cost savings and better performance.\n\n"
            "Companies like Amazon and Google use cloud. This helps them scale and be reliable.\n\n"
            "Cloud is becoming more popular every year."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 0,  # Alice — second submission, ambiguous example
        "category": "ambiguous",
        "content": (
            "Cloud computing is the delivery of computing services over the internet. "
            "It offers scalability and cost efficiency as main advantages.\n\n"
            "For example, Netflix. Also Spotify.\n\n"  # very terse examples
            "These companies benefit greatly from using cloud services."
        ),
        "draft_score": None,
        "has_revision": True,
        "revision_content": (
            "Cloud computing is the delivery of on-demand computing services—servers, storage, "
            "databases, networking, and software—over the internet.\n\n"
            "A key advantage is scalability: resources can be added or removed instantly based on "
            "demand. Another advantage is cost savings through the pay-as-you-go model.\n\n"
            "Netflix uses Amazon Web Services to deliver streaming video to over 220 million "
            "subscribers globally. Spotify relies on Google Cloud Platform to run its music "
            "recommendation engine and audio delivery at scale.\n\n"
            "In summary, cloud computing enables businesses to operate more efficiently and "
            "scale globally at lower cost."
        ),
        "revision_score": 86.0,
    },
    # -------------------------------------------------------------------------
    # HIGH-IMPACT: suspected plagiarism (long copy-paste-style text)
    # -------------------------------------------------------------------------
    {
        "student_idx": 6,  # George — second submission
        "category": "high_impact_plagiarism",
        "content": (
            "Cloud computing is a model for enabling ubiquitous convenient on-demand network "
            "access to a shared pool of configurable computing resources including networks "
            "servers storage applications and services that can be rapidly provisioned and "
            "released with minimal management effort or service provider interaction this model "
            "is composed of five essential characteristics three service models and four "
            "deployment models and has been formally defined by the National Institute of "
            "Standards and Technology NIST in their landmark publication SP 800-145 which "
            "established the authoritative definition used by governments and enterprises "
            "worldwide across all major industries sectors and geographic regions."
        ),
        "draft_score": None,
        "has_revision": False,
        "is_high_impact": True,
    },
    # -------------------------------------------------------------------------
    # HIGH-IMPACT: very low performance
    # -------------------------------------------------------------------------
    {
        "student_idx": 1,  # Bob — extreme low
        "category": "high_impact_low",
        "content": "I dont know",
        "draft_score": None,
        "has_revision": False,
        "is_high_impact": True,
    },
    # -------------------------------------------------------------------------
    # FALSE-POSITIVE cases
    # -------------------------------------------------------------------------
    {
        "student_idx": 3,  # David — second submission
        "category": "false_positive",
        "content": (
            "Cloud computing can be defined as a paradigm in which computing resources—servers, "
            "storage, databases, networking, and applications—are provided over the internet on "
            "an on-demand basis.\n\n"
            "The scalability advantage of cloud is demonstrated by how AWS helped a startup scale "
            "from 100 to 10 million users without infrastructure changes. Another advantage is "
            "disaster recovery: Azure's geo-redundant storage allows organizations to recover "
            "from hardware failures within seconds.\n\n"
            "Netflix represents a compelling real-world example: by migrating to AWS, they "
            "reduced costs by 40% while improving streaming quality globally. "
            "Zoom is another excellent case—during the COVID-19 pandemic, Zoom scaled from "
            "10 million to 300 million daily meeting participants in weeks by leveraging cloud "
            "elasticity.\n\n"
            "To conclude, cloud computing offers substantial technological and economic advantages "
            "that are well-demonstrated in the success of companies like Netflix and Zoom."
        ),
        "draft_score": None,
        "has_revision": False,
        "is_high_impact": True,  # Triggers RULE_HI_002 (high score) — false positive for authenticity concern
    },
    # -------------------------------------------------------------------------
    # ADDITIONAL diverse submissions to reach 20+
    # -------------------------------------------------------------------------
    {
        "student_idx": 4,  # Elan — second
        "category": "moderate",
        "content": (
            "Cloud computing is a technology that delivers IT services over the internet. "
            "It includes storage, servers, and software.\n\n"
            "The main advantage is cost savings because companies pay only for what they use. "
            "Also, it provides accessibility since employees can work from anywhere.\n\n"
            "One example is Dropbox, which stores files for millions of users. "
            "Another is GitHub, used by developers to host code."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 5,  # Fatima — second
        "category": "moderate",
        "content": (
            "Cloud computing means using internet to access computing resources instead of "
            "local hardware. This model allow businesses to be more agile.\n\n"
            "Advantages: scalability and cost reduction. When a business needs more compute "
            "power, cloud allows rapid expansion. Cost reduction happens because companies "
            "avoid large capital expenditures.\n\n"
            "Examples: Salesforce delivers CRM over the cloud; Heroku helps developers deploy "
            "applications without managing servers.\n\n"
            "Overall cloud computing is revolutionary technology for businesses."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 7,  # Hannah — second
        "category": "moderate",
        "content": (
            "Cloud computing is internet-based on-demand computing.\n\n"
            "Advantages: reliability through redundancy and automatic backups; "
            "collaboration — teams can share files instantly.\n\n"
            "Examples include IBM Cloud used by large enterprises and AWS used by Netflix.\n\n"
            "Cloud computing improves efficiency significantly."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 8,  # Ivan — second
        "category": "strong",
        "content": (
            "Cloud computing is a model for delivering computing services over the internet, "
            "enabling on-demand access to shared resources like servers, storage, and software.\n\n"
            "Key advantages include: first, scalability — businesses can adjust resources in "
            "real time based on demand, avoiding both over-provisioning and under-provisioning. "
            "Second, cost efficiency — the pay-as-you-go model eliminates large capital "
            "expenditures and ongoing maintenance costs.\n\n"
            "Furthermore, cloud computing enables disaster recovery through geographic "
            "redundancy and automatic backups.\n\n"
            "Real-world examples: Netflix migrated to AWS to support global streaming at scale, "
            "reducing operational costs significantly. Slack uses AWS for its messaging platform, "
            "ensuring high availability for millions of daily users.\n\n"
            "In conclusion, cloud computing offers transformative advantages in scalability, "
            "cost efficiency, and reliability for organizations worldwide."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 9,  # Julia — second, strong
        "category": "strong",
        "content": (
            "Cloud computing refers to the delivery of computing services over the internet, "
            "providing on-demand access to servers, storage, databases, and applications.\n\n"
            "One significant advantage is scalability. Organizations can rapidly scale IT "
            "resources to meet demand spikes without costly hardware procurement. "
            "Additionally, cloud computing delivers cost savings through the elimination of "
            "capital expenditure on physical infrastructure.\n\n"
            "A third advantage is improved collaboration — teams distributed across the globe "
            "can access shared files and applications from any location.\n\n"
            "In practice, Netflix leverages Amazon Web Services to deliver content to more than "
            "200 million subscribers. Google Cloud is used by Spotify to run its recommendation "
            "algorithms and serve audio streams at global scale.\n\n"
            "In summary, cloud computing is a foundational technology enabling scalability, "
            "cost efficiency, and global collaboration."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 2,  # Carla — second
        "category": "moderate",
        "content": (
            "Cloud computing is technology for access computing over internet. "
            "It is mean that company use server of other company instead buy own server.\n\n"
            "The advantage is: you save money because you not spend on hardware. "
            "Also you can scale when your business grow.\n\n"
            "Example is AWS using by Netflix for streaming video to users. "
            "Also GitHub using Microsoft Azure for host the code of developers.\n\n"
            "So cloud computing is important for modern business today."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    {
        "student_idx": 1,  # Bob — third submission (after revision)
        "category": "weak",
        "content": (
            "Cloud makes work easier. Companies save time and money. I think it is the "
            "future of technology."
        ),
        "draft_score": None,
        "has_revision": False,
    },
    # High-impact: borderline moderate (will trigger low-confidence review)
    {
        "student_idx": 6,  # George — third
        "category": "ambiguous",
        "content": (
            "Cloud computing delivers services over internet. "
            "Benefit: saves cost. Example: AWS.\n\n"
            "Also Google Cloud. Companies use it for storage."
        ),
        "draft_score": None,
        "has_revision": False,
    },
]

# ---------------------------------------------------------------------------
# Seeding function
# ---------------------------------------------------------------------------

def seed_database(db: Session) -> None:
    """Idempotent seed — skips if data already exists."""
    if db.query(Student).count() > 0:
        seed_experiments_and_validation(db)
        return

    # 1. Rubric
    rubric = Rubric(
        name="Cloud Computing Assignment Rubric",
        description="Rubric for: 'Explain the advantages of cloud computing and provide two real-world examples.'",
    )
    db.add(rubric)
    db.flush()

    criterion_map: dict[str, RubricCriterion] = {}
    for i, cdata in enumerate(RUBRIC_CRITERIA):
        crit = RubricCriterion(
            rubric_id=rubric.id,
            **cdata,
        )
        db.add(crit)
        db.flush()
        criterion_map[cdata["criterion_id"]] = crit

    # 2. Assignment
    assignment = Assignment(
        title="Cloud Computing Essay",
        description=(
            "Explain the advantages of cloud computing and provide at least two real-world "
            "examples of companies or services that use cloud computing. "
            "Your response should include a definition, at least two advantages, "
            "and two specific examples. Aim for 150–300 words."
        ),
        rubric_id=rubric.id,
    )
    db.add(assignment)
    db.flush()

    # 3. Students
    student_objs = []
    for sdata in STUDENTS:
        s = Student(name=sdata["name"], email=sdata["email"])
        db.add(s)
        db.flush()
        student_objs.append(s)

    # 4. Submissions + feedback + reviews
    base_time = datetime(2024, 3, 1, 9, 0, 0)

    for i, sub_data in enumerate(SUBMISSIONS):
        student = student_objs[sub_data["student_idx"]]
        submitted_at = base_time + timedelta(hours=i * 3)

        # Create submission
        submission = Submission(
            student_id=student.id,
            assignment_id=assignment.id,
            content=sub_data["content"],
            submitted_at=submitted_at,
            is_final=False,
            version=1,
        )
        db.add(submission)
        db.flush()

        # Run feedback engine
        from feedback_engine import analyze_submission
        engine_out = analyze_submission(sub_data["content"])
        submission.draft_score = engine_out.score

        # Store feedback items
        review_created = False
        for fb in engine_out.feedback:
            crit_obj = criterion_map.get(fb.criterion_key)
            fi = FeedbackItem(
                submission_id=submission.id,
                criterion_id=crit_obj.id if crit_obj else None,
                message=fb.message,
                evidence=fb.evidence or "",
                rule_id=fb.rule_id,
                confidence=fb.confidence,
                priority=fb.priority,
                requires_human_review=fb.requires_human_review,
                high_impact_reason=fb.high_impact_reason,
                generated_at=submitted_at + timedelta(seconds=5),
            )
            db.add(fi)
            db.flush()

            # Create mentor review for high-impact items
            if fb.requires_human_review and not review_created:
                category = sub_data["category"]
                # Simulate some reviews already decided
                if category in ("high_impact_plagiarism", "high_impact_low"):
                    # Mentor has already reviewed
                    status = "rejected" if category == "high_impact_plagiarism" else "approved"
                    review = Review(
                        feedback_id=fi.id,
                        status=status,
                        reviewer="Dr. Sarah Kim",
                        reviewed_at=submitted_at + timedelta(hours=2),
                        override_reason=(
                            "After reviewing the full submission, this appears to be the "
                            "student's own phrasing influenced by lecture slides. "
                            "Not plagiarism. Continue with normal feedback."
                        ) if status == "rejected" else None,
                        original_recommendation=fb.message,
                        final_decision=(
                            "Not plagiarism — student's own work. Proceed with standard feedback."
                        ) if status == "rejected" else "Student needs targeted support sessions.",
                    )
                elif category == "false_positive":
                    review = Review(
                        feedback_id=fi.id,
                        status="modified",
                        reviewer="Prof. James Rivera",
                        reviewed_at=submitted_at + timedelta(hours=4),
                        override_reason=(
                            "This is a high-quality original submission. The authenticity flag "
                            "was a false positive triggered by the high score rule. "
                            "No further action needed."
                        ),
                        original_recommendation=fb.message,
                        final_decision="Confirmed excellent original submission. Grade as submitted.",
                    )
                else:
                    # Pending review
                    review = Review(
                        feedback_id=fi.id,
                        status="pending",
                        reviewer=None,
                        reviewed_at=None,
                        override_reason=None,
                        original_recommendation=fb.message,
                        final_decision=None,
                    )
                db.add(review)
                review_created = True

        # Handle revisions
        if sub_data.get("has_revision") and sub_data.get("revision_content"):
            rev_time = submitted_at + timedelta(days=2)
            revision = Revision(
                original_submission_id=submission.id,
                content=sub_data["revision_content"],
                submitted_at=rev_time,
                version=2,
            )
            # Score revision
            rev_engine = analyze_submission(sub_data["revision_content"])
            revision.score = sub_data.get("revision_score") or round(rev_engine.score, 2)
            submission.final_score = revision.score
            submission.is_final = True
            db.add(revision)

    db.commit()
    print(f"[seed] Database seeded with {len(SUBMISSIONS)} submissions.")
    seed_experiments_and_validation(db)


def seed_experiments_and_validation(db: Session) -> None:
    """Seeds baseline & prototype experiment observations, error analysis records, and validations."""
    if db.query(Experiment).count() > 0:
        return

    assignment = db.query(Assignment).first()
    assignment_id = assignment.id if assignment else 1
    students = db.query(Student).all()
    student_map = {s.name: s for s in students}

    # 1. Experiment Record
    exp = Experiment(
        experiment_id="EXP-2026-001",
        name="Formative Feedback Assistant Efficacy & Human-in-the-Loop Study",
        description=(
            "Evaluation of student revision quality, rubric coverage, and instructor feedback "
            "adherence comparing traditional generic delayed feedback (Baseline) against the "
            "Formative Feedback Assistant with human mentor review (Prototype)."
        ),
        baseline_definition=(
            "BASELINE / DEMO EXPERIMENT: Students receive generic delayed instructor comments "
            "without the assistant's detailed actionable guidance, rule explanation, or evidence detection."
        ),
        target=(
            "Draft → Final quality gain ≥ +35% relative improvement, "
            "Rubric coverage ≥ 85%, Feedback usefulness ≥ 4.0/5, "
            "100% human review for high-impact decisions."
        ),
        start_date=datetime(2026, 8, 1, 9, 0),
        end_date=datetime(2026, 8, 30, 18, 0),
        status="completed",
    )
    db.add(exp)
    db.flush()

    # 2. Baseline Group Observations (5 students with generic delayed feedback)
    baseline_data = [
        {
            "student_name": "Student A (Control)",
            "draft_score": 48.0,
            "final_score": 60.0,
            "cov_draft": 40.0,
            "cov_final": 60.0,
            "feedback_used": "Generic Delayed Comment: 'Good start. Please expand definition and add more examples.'",
            "instructor_feedback": "Add another real-world example.",
            "instructor_addressed": False,
            "instructor_evidence": "Final draft still mentioned only AWS without a second named company.",
            "revision_count": 1,
            "recs_gen": 0,
            "recs_act": 0,
        },
        {
            "student_name": "Student B (Control)",
            "draft_score": 52.0,
            "final_score": 64.0,
            "cov_draft": 50.0,
            "cov_final": 65.0,
            "feedback_used": "Generic Delayed Comment: 'Review advantages and cost breakdown.'",
            "instructor_feedback": "Explain how pay-as-you-go saves costs.",
            "instructor_addressed": True,
            "instructor_evidence": "Added a short sentence noting that startups avoid buying hardware.",
            "revision_count": 1,
            "recs_gen": 0,
            "recs_act": 0,
        },
        {
            "student_name": "Student C (Control)",
            "draft_score": 42.0,
            "final_score": 55.0,
            "cov_draft": 35.0,
            "cov_final": 55.0,
            "feedback_used": "Generic Delayed Comment: 'Draft is too brief. Expand all sections.'",
            "instructor_feedback": "Provide at least two distinct advantages.",
            "instructor_addressed": True,
            "instructor_evidence": "Listed flexibility as a bullet point in conclusion.",
            "revision_count": 1,
            "recs_gen": 0,
            "recs_act": 0,
        },
        {
            "student_name": "Student D (Control)",
            "draft_score": 58.0,
            "final_score": 68.0,
            "cov_draft": 55.0,
            "cov_final": 70.0,
            "feedback_used": "Generic Delayed Comment: 'Work on paragraph organization and flow.'",
            "instructor_feedback": "Separate definition and advantages into distinct paragraphs.",
            "instructor_addressed": False,
            "instructor_evidence": "Paragraphs remained merged into a single block of text.",
            "revision_count": 1,
            "recs_gen": 0,
            "recs_act": 0,
        },
        {
            "student_name": "Student E (Control)",
            "draft_score": 46.0,
            "final_score": 58.0,
            "cov_draft": 45.0,
            "cov_final": 60.0,
            "feedback_used": "Generic Delayed Comment: 'Include concrete industry use cases.'",
            "instructor_feedback": "Give real-world business examples.",
            "instructor_addressed": True,
            "instructor_evidence": "Mentioned Dropbox briefly in the final sentence.",
            "revision_count": 1,
            "recs_gen": 0,
            "recs_act": 0,
        },
    ]

    for item in baseline_data:
        imp = round(item["final_score"] - item["draft_score"], 2)
        rel = round((imp / item["draft_score"]) * 100, 2)
        obs = ExperimentObservation(
            experiment_id=exp.id,
            student_id=None,
            assignment_id=assignment_id,
            group="BASELINE",
            draft_score=item["draft_score"],
            final_score=item["final_score"],
            improvement_points=imp,
            relative_improvement=rel,
            rubric_coverage_draft=item["cov_draft"],
            rubric_coverage_final=item["cov_final"],
            feedback_used=item["feedback_used"],
            instructor_feedback=item["instructor_feedback"],
            instructor_feedback_addressed=item["instructor_addressed"],
            instructor_feedback_evidence=item["instructor_evidence"],
            revision_count=item["revision_count"],
            recommendations_generated=item["recs_gen"],
            recommendations_acted_upon=item["recs_act"],
            student_name=item["student_name"],
        )
        db.add(obs)

    # 3. Prototype Group Observations (students with Formative Feedback Assistant)
    prototype_data = [
        {
            "student_name": "Carla Mendes",
            "draft_score": 46.0,
            "final_score": 78.0,
            "cov_draft": 40.0,
            "cov_final": 90.0,
            "feedback_used": "Formative Feedback Assistant (RULE_DEF_001, RULE_ADV_001, RULE_EX_001)",
            "instructor_feedback": "Add another real-world example.",
            "instructor_addressed": True,
            "instructor_evidence": "Contains AWS and Google Cloud examples with streaming use cases.",
            "revision_count": 2,
            "recs_gen": 3,
            "recs_act": 3,
        },
        {
            "student_name": "David Chen",
            "draft_score": 52.0,
            "final_score": 82.0,
            "cov_draft": 50.0,
            "cov_final": 95.0,
            "feedback_used": "Formative Feedback Assistant (RULE_ADV_002, RULE_EX_002)",
            "instructor_feedback": "Clarify how scalability prevents downtime during spikes.",
            "instructor_addressed": True,
            "instructor_evidence": "Added auto-scaling details during holiday e-commerce traffic.",
            "revision_count": 2,
            "recs_gen": 2,
            "recs_act": 2,
        },
        {
            "student_name": "Elan Goldberg",
            "draft_score": 40.0,
            "final_score": 77.0,
            "cov_draft": 35.0,
            "cov_final": 88.0,
            "feedback_used": "Formative Feedback Assistant (RULE_DEF_001, RULE_ADV_001, RULE_EX_001)",
            "instructor_feedback": "Add specific quantified support for cost reduction.",
            "instructor_addressed": True,
            "instructor_evidence": "Included capital expenditure vs operational expenditure breakdown.",
            "revision_count": 2,
            "recs_gen": 3,
            "recs_act": 3,
        },
        {
            "student_name": "Hannah Park",
            "draft_score": 38.0,
            "final_score": 72.0,
            "cov_draft": 30.0,
            "cov_final": 85.0,
            "feedback_used": "Formative Feedback Assistant (RULE_CLR_001, RULE_DEF_001)",
            "instructor_feedback": "Expand submission to at least 150 words.",
            "instructor_addressed": True,
            "instructor_evidence": "Draft was 22 words, revision expanded to 184 words.",
            "revision_count": 2,
            "recs_gen": 2,
            "recs_act": 2,
        },
        {
            "student_name": "George Osei",
            "draft_score": 25.0,
            "final_score": 68.0,
            "cov_draft": 20.0,
            "cov_final": 80.0,
            "feedback_used": "Formative Feedback Assistant (RULE_CLR_001, RULE_DEF_001, RULE_EX_001)",
            "instructor_feedback": "Address all rubric sections thoroughly.",
            "instructor_addressed": True,
            "instructor_evidence": "Added definition, two advantages, and two company examples.",
            "revision_count": 2,
            "recs_gen": 3,
            "recs_act": 3,
        },
        {
            "student_name": "Ivan Petrov",
            "draft_score": 58.0,
            "final_score": 81.0,
            "cov_draft": 60.0,
            "cov_final": 90.0,
            "feedback_used": "Formative Feedback Assistant (RULE_ADV_002, RULE_LANG_001)",
            "instructor_feedback": "Connect examples clearly to advantages.",
            "instructor_addressed": True,
            "instructor_evidence": "Linked Netflix to scalability and Spotify to global latency reduction.",
            "revision_count": 2,
            "recs_gen": 2,
            "recs_act": 2,
        },
        {
            "student_name": "Julia Martinez",
            "draft_score": 62.0,
            "final_score": 85.0,
            "cov_draft": 65.0,
            "cov_final": 95.0,
            "feedback_used": "Formative Feedback Assistant (RULE_EX_002, RULE_ORG_001)",
            "instructor_feedback": "Separate definition from advantages into distinct paragraphs.",
            "instructor_addressed": False,
            "instructor_evidence": "Paragraphs remained combined despite warning.",
            "revision_count": 2,
            "recs_gen": 2,
            "recs_act": 1,
        },
    ]

    for item in prototype_data:
        imp = round(item["final_score"] - item["draft_score"], 2)
        rel = round((imp / item["draft_score"]) * 100, 2)
        st_obj = student_map.get(item["student_name"])
        obs = ExperimentObservation(
            experiment_id=exp.id,
            student_id=st_obj.id if st_obj else None,
            assignment_id=assignment_id,
            group="PROTOTYPE",
            draft_score=item["draft_score"],
            final_score=item["final_score"],
            improvement_points=imp,
            relative_improvement=rel,
            rubric_coverage_draft=item["cov_draft"],
            rubric_coverage_final=item["cov_final"],
            feedback_used=item["feedback_used"],
            instructor_feedback=item["instructor_feedback"],
            instructor_feedback_addressed=item["instructor_addressed"],
            instructor_feedback_evidence=item["instructor_evidence"],
            revision_count=item["revision_count"],
            recommendations_generated=item["recs_gen"],
            recommendations_acted_upon=item["recs_act"],
            student_name=item["student_name"],
        )
        db.add(obs)

    # 4. Error Analysis Records
    error_seeds = [
        {
            "student_name": "Alice Johnson",
            "recommendation": "Exceptionally high score authenticity check (RULE_HI_002)",
            "expected_result": "No authenticity warning — submission is genuine student work.",
            "actual_result": "High-impact flag created requiring mentor review.",
            "error_type": "False positive",
            "impact": "Unnecessary mentor review queue item for a strong authentic submission.",
            "correction_improvement": "Calibrate score threshold and cross-reference revision history before flagging.",
            "ground_truth_available": True,
            "is_correct": False,
        },
        {
            "student_name": "Ivan Petrov",
            "recommendation": "Fewer than 2 advantages detected (RULE_ADV_001)",
            "expected_result": "Detect subtle advantage phrasing ('drastically cuts server bills') in non-native draft.",
            "actual_result": "RULE_ADV_001 fired because exact keywords were absent.",
            "error_type": "False negative",
            "impact": "Student was told they were missing an advantage they had informally expressed.",
            "correction_improvement": "Expand keyword lexicon for advantage detection to support colloquial and ESL variants.",
            "ground_truth_available": True,
            "is_correct": False,
        },
        {
            "student_name": "Bob Smith",
            "recommendation": "Missing real-world examples (RULE_EX_001)",
            "expected_result": "Snippet should cleanly quote the example sentence without leading punctuation.",
            "actual_result": "Evidence snippet captured preceding period and paragraph break: '. \\n\\nFor example...'",
            "error_type": "Incorrect evidence",
            "impact": "Messy UI quote snippet reducing explainability for student and mentor.",
            "correction_improvement": "Add .strip() and regex sentence boundary normalization in extract_evidence.",
            "ground_truth_available": True,
            "is_correct": False,
        },
        {
            "student_name": "Carla Mendes",
            "recommendation": "Definition Missing or Too Brief (RULE_DEF_001)",
            "expected_result": "Recognize definition formatted under a markdown header '### Concept Definition'.",
            "actual_result": "RULE_DEF_001 fired because header formatting wasn't stripped.",
            "error_type": "Incorrect rule",
            "impact": "Incorrect advice given to student who organized their essay with markdown.",
            "correction_improvement": "Preprocess text to strip markdown headers and bullets prior to pattern matching.",
            "ground_truth_available": True,
            "is_correct": False,
        },
        {
            "student_name": "George Osei",
            "recommendation": "Ambiguous Example Context (RULE_EX_003)",
            "expected_result": "Flag ambiguous reference to 'Amazon' (e-commerce vs AWS) for mentor check.",
            "actual_result": "RULE_EX_003 fired with confidence 0.45; queued for human review.",
            "error_type": "Low-confidence recommendation",
            "impact": "Appropriately queued for mentor oversight; mentor approved after confirming cloud context.",
            "correction_improvement": "Correct system behavior — low confidence recommendations must seek human review.",
            "ground_truth_available": True,
            "is_correct": True,
        },
        {
            "student_name": "Ivan Petrov",
            "recommendation": "Language / Grammar Feedback (RULE_LANG_001)",
            "expected_result": "Grammar advice provided as low-priority informational note without reducing concept score.",
            "actual_result": "RULE_LANG_001 fired with low priority; conceptual rubric score remained at 58.0.",
            "error_type": "Language-related issue",
            "impact": "Protected non-native speaker from unfair grading penalty while providing helpful language tips.",
            "correction_improvement": "System working as designed. Continue strict isolation between language and rubric scoring.",
            "ground_truth_available": True,
            "is_correct": True,
        },
        {
            "student_name": "Julia Martinez",
            "recommendation": "Weak Organization (RULE_ORG_001)",
            "expected_result": "Submission contained 250 words in a single unbroken block; flag for structure.",
            "actual_result": "RULE_ORG_001 fired with medium priority and suggested paragraph transitions.",
            "error_type": "Ambiguous submission",
            "impact": "Helped student improve readability on revision.",
            "correction_improvement": "Accurate recommendation; student improved score on second draft.",
            "ground_truth_available": True,
            "is_correct": True,
        },
        {
            "student_name": "Hannah Park",
            "recommendation": "Possible Plagiarism Signal (RULE_PLAG_001)",
            "expected_result": "Mentor override because phrase matched standard slide definition.",
            "actual_result": "Review created; mentor Dr. Sarah Kim rejected flag with documented reason.",
            "error_type": "Human override",
            "impact": "Human-in-the-loop prevented unfair academic penalty.",
            "correction_improvement": "Incorporate course slide corpus into false-positive exclusion whitelist.",
            "ground_truth_available": True,
            "is_correct": True,
        },
        {
            "student_name": "Unverified Student Draft",
            "recommendation": "Pending expert rubric rater evaluation",
            "expected_result": None,
            "actual_result": "Automated evaluation generated without secondary expert human rater baseline.",
            "error_type": "Ground truth not available",
            "impact": "Cannot assess accuracy without human expert annotation.",
            "correction_improvement": "Schedule double-blind rubric rating with course teaching assistants.",
            "ground_truth_available": False,
            "is_correct": False,
        },
    ]

    for er in error_seeds:
        rec = ErrorAnalysisRecord(
            student_name=er["student_name"],
            recommendation=er["recommendation"],
            expected_result=er["expected_result"],
            actual_result=er["actual_result"],
            error_type=er["error_type"],
            impact=er["impact"],
            correction_improvement=er["correction_improvement"],
            ground_truth_available=er["ground_truth_available"],
            is_correct=er["is_correct"],
            created_at=datetime.utcnow(),
        )
        db.add(rec)

    # 5. Accessibility Checklist Records (All 8 required items)
    accessibility_items = [
        ("Keyboard navigation", "Pass", "All buttons, inputs, tabs, and collapsible cards are reachable via Tab/Shift+Tab and operable with Enter/Space."),
        ("Visible focus indicators", "Pass", "2px solid focus rings styled with --color-primary across all interactive controls."),
        ("Semantic labels", "Pass", "Proper headings hierarchy (h1, h2, h3), role='navigation', role='alert', and aria-live regions."),
        ("Form labels", "Pass", "Every form input has an explicitly associated <label htmlFor=...> element."),
        ("Readable text", "Pass", "High-contrast typography meeting WCAG 2.1 AA (4.5:1 ratio for normal text on dark theme)."),
        ("Color-independent status indicators", "Pass", "Status badges combine icons, distinct text (Approved/Rejected/Modified), and borders alongside colors."),
        ("Error messages", "Pass", "Inline error alerts with role='alert' and descriptive warning text."),
        ("Screen-reader compatibility check", "Pass", "Descriptive aria-labels on review actions, meters, and score pills; no silent icon-only buttons."),
    ]

    for item_name, status, comments in accessibility_items:
        db.add(AccessibilityCheckRecord(
            item_name=item_name,
            status=status,
            comments=comments,
            tester="Accessibility Auditor (WCAG 2.1 AA)",
            checked_at=datetime.utcnow(),
        ))

    # 6. Explainability Validation Records (All 7 required questions)
    explainability_items = [
        ("What recommendation was made?", "UNDERSTOOD", "Clear imperative guidance (e.g. 'Add at least one more real-world example...')."),
        ("What evidence caused it?", "UNDERSTOOD", "Specific quote from student text displayed in dedicated evidence card."),
        ("Which rubric criterion was involved?", "UNDERSTOOD", "Criterion name clearly stated (e.g. 'Real-World Examples (30%)')."),
        ("Which rule was applied?", "UNDERSTOOD", "Human-readable rule name shown alongside technical rule ID (e.g. RULE_EX_001 — Insufficient Real-World Examples)."),
        ("What does the rule mean?", "UNDERSTOOD", "Plain-English explanation provided for all 13 rules in registry."),
        ("What is the confidence?", "UNDERSTOOD", "Percentage meter with helper explaining it measures rule certainty, not student quality."),
        ("Why was human review required?", "UNDERSTOOD", "Prominent banner specifies exact trigger (plagiarism signal, extreme score, or low confidence)."),
    ]

    for q, status, comm in explainability_items:
        db.add(ExplainabilityValidationRecord(
            question=q,
            status=status,
            comment=comm,
            tester_role="Mentor & Student Panel",
            created_at=datetime.utcnow(),
        ))

    # 7. User Validation Records (Representative student and instructor evaluations)
    student_eval = UserValidationRecord(
        role="Student",
        task_ratings=json.dumps([
            {"task_id": 1, "task_name": "Understand feedback", "success": True, "ease_rating": 5, "comment": "Feedback was clear and told me what to fix."},
            {"task_id": 2, "task_name": "Find evidence", "success": True, "ease_rating": 4, "comment": "Quote helped me see which sentence had the issue."},
            {"task_id": 3, "task_name": "Understand why recommendation was generated", "success": True, "ease_rating": 5, "comment": "The rule explanation clarified the rubric expectation."},
            {"task_id": 4, "task_name": "Complete a revision", "success": True, "ease_rating": 4, "comment": "Revision box was easy to use; score improved immediately."},
            {"task_id": 5, "task_name": "Understand when human review is required", "success": True, "ease_rating": 5, "comment": "Clear warning when mentor review was pending."},
        ]),
        accessibility_feedback="Keyboard navigation was smooth. Good color contrast.",
        language_feedback="Helpful that minor grammar mistakes did not penalize my concept score.",
        explainability_feedback="Knowing the exact rule gave me confidence in revising.",
        overall_usefulness_rating=5,
        created_at=datetime.utcnow() - timedelta(days=3),
    )
    db.add(student_eval)

    mentor_eval = UserValidationRecord(
        role="Mentor/Instructor",
        task_ratings=json.dumps([
            {"task_id": 1, "task_name": "Understand feedback", "success": True, "ease_rating": 5, "comment": "Recommendations align well with grading rubric."},
            {"task_id": 2, "task_name": "Find evidence", "success": True, "ease_rating": 5, "comment": "Having the full submission and separate evidence snippet is invaluable."},
            {"task_id": 3, "task_name": "Understand why recommendation was generated", "success": True, "ease_rating": 5, "comment": "The 'WHY THIS RULE FIRED' section saves review time."},
            {"task_id": 4, "task_name": "Complete a revision", "success": True, "ease_rating": 4, "comment": "Timeline clearly tracks draft-to-final score delta."},
            {"task_id": 5, "task_name": "Understand when human review is required", "success": True, "ease_rating": 5, "comment": "High-impact queue ensures plagiarism and extreme scores are never auto-finalized."},
        ]),
        accessibility_feedback="Screen-reader aria tags are well implemented. Contrast is comfortable.",
        language_feedback="Separating ESL grammar from conceptual depth is pedagogically sound.",
        explainability_feedback="Confidence helper text prevents mentors from confusing rule certainty with student score.",
        overall_usefulness_rating=5,
        created_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(mentor_eval)

    db.commit()
    print("[seed] Experiments, Baseline, Error Analysis, and Validations seeded successfully.")
