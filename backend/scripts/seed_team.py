"""Generate a 30-engineer seed dataset for config/data.json."""

from __future__ import annotations

import json
import random
from datetime import date, timedelta
from pathlib import Path

FIRST = [
    "Sarah", "Marcus", "Priya", "James", "Elena", "David", "Amara", "Tyler", "Nina", "Omar",
    "Lisa", "Ryan", "Keiko", "Andre", "Sophie", "Carlos", "Maya", "Ethan", "Aisha", "Ben",
    "Chloe", "Daniel", "Fatima", "Greg", "Hannah", "Ivan", "Julia", "Kevin", "Luna", "Noah",
]
LAST = [
    "Chen", "Webb", "Sharma", "OBrien", "Rodriguez", "Kim", "Okonkwo", "Foster", "Patel", "Hassan",
    "Nguyen", "Cooper", "Tanaka", "Silva", "Martin", "Rivera", "Brooks", "Clark", "Williams", "Carter",
    "Davis", "Evans", "Ali", "Murphy", "Lee", "Petrov", "Santos", "Wright", "Zhang", "Adams",
]
ROLES = [
    ("Engineer", 0.35),
    ("Senior Engineer", 0.35),
    ("Staff Engineer", 0.15),
    ("Principal Engineer", 0.1),
    ("Engineering Manager", 0.05),
]
SKILLS = [
    "Python", "TypeScript", "React", "Go", "Kubernetes", "AWS", "GCP", "Data Pipelines", "ML",
    "Security", "DevOps", "Architecture", "Mobile", "FinTech", "Analytics", "Cloud", "Backend",
    "Frontend", "CI/CD", "PostgreSQL",
]
PROJECT_IDS = [f"proj-{i}" for i in range(1, 11)]


def pick_role(rng: random.Random) -> str:
    roll = rng.random()
    cumulative = 0.0
    for role, weight in ROLES:
        cumulative += weight
        if roll <= cumulative:
            return role
    return "Engineer"


def week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def build_timeline(base: int, rng: random.Random) -> list[dict]:
    today = date.today()
    current = week_start(today)
    start = current - timedelta(weeks=2)
    timeline: list[dict] = []
    for index in range(8):
        week = start + timedelta(weeks=index)
        drift = (index - 2) * 3
        value = max(0, min(150, base + drift - (index % 3) * 5 + rng.randint(-2, 2)))
        timeline.append({"weekStart": week.isoformat(), "utilization": value, "note": None})
    return timeline


def status_for(utilization: int) -> str:
    if utilization >= 100:
        return "overallocated"
    if utilization >= 50:
        return "allocated"
    return "available"


def build_engineers(count: int = 30, seed: int = 42) -> list[dict]:
    rng = random.Random(seed)
    engineers: list[dict] = []
    for index in range(count):
        first, last = FIRST[index], LAST[index]
        utilization = rng.randint(35, 115)
        project_count = 0 if utilization < 55 else rng.randint(1, 3)
        projects = rng.sample(PROJECT_IDS, k=min(project_count, len(PROJECT_IDS))) if project_count else []
        engineers.append(
            {
                "id": f"eng-{index + 1}",
                "name": f"{first} {last}",
                "role": pick_role(rng),
                "email": f"{first.lower()}.{last.lower()}@company.com",
                "capacity": 100,
                "utilization": utilization,
                "status": status_for(utilization),
                "skills": rng.sample(SKILLS, k=rng.randint(2, 5)),
                "currentProjects": projects,
                "utilizationTimeline": build_timeline(utilization, rng),
                "avatar": None,
            }
        )
    return engineers


def main() -> None:
    config_path = Path(__file__).resolve().parents[1] / "config" / "data.json"
    data = json.loads(config_path.read_text(encoding="utf-8"))
    data["engineers"] = build_engineers()
    data["lastUpdated"] = date.today().isoformat() + "T12:00:00Z"
    config_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(data['engineers'])} engineers to {config_path}")


if __name__ == "__main__":
    main()
