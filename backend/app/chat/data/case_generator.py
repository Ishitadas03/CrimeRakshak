"""Synthetic case-level dataset generator (Blocks 2 & 6 foundation).

The real KSP CSVs are aggregate statistics only, so case-level features
(criminal networks, repeat offenders, case summaries) run on SYNTHETIC data
generated here. Output is three flat CSVs in ``datasets/synthetic_cases/``
which the DuckDB loader ingests like any other dataset:

  * cases.csv         — one row per FIR (dated 2024-2026 with seasonal bias)
  * case_people.csv   — accused / victims linked to FIRs (repeat offenders,
                        gangs that co-offend, shared hotspots)
  * case_accounts.csv — bank accounts linked to financial-crime FIRs
                        (shared accounts create transaction links)

Every row carries ``is_synthetic=True``. Deterministic via a fixed seed.

Run:  python -m app.chat.data.case_generator
"""
from __future__ import annotations

import csv
import random
from datetime import date, timedelta
from pathlib import Path

from faker import Faker

SEED = 42
NUM_CASES = 1200
NUM_OFFENDERS = 320
NUM_GANGS = 12

DISTRICTS = [
    "Bengaluru City", "Mysuru", "Tumakuru", "Belagavi", "Kalaburagi",
    "Dakshina Kannada", "Vijayapur", "Ballari", "Davanagere", "Shivamogga",
    "Hassan", "Mandya", "Udupi", "Dharwad", "Bagalkot", "Chickballapura",
    "Kolar", "Raichur",
]

# crime type -> (sections, MO options, is_financial, seasonal peak months)
CRIME_PROFILES: dict[str, tuple[str, list[str], bool, list[int]]] = {
    "Murder": ("BNS 103", ["personal enmity", "property dispute", "gang rivalry"], False, []),
    "Robbery": ("BNS 309", ["knife-point street robbery", "highway vehicle stop", "ATM-exit targeting"], False, [10, 11, 12]),
    "Chain Snatching": ("BNS 304", ["two-wheeler drive-by snatching", "market crowd snatching"], False, [10, 11]),
    "Burglary": ("BNS 331", ["night house-break via rear entry", "lock-picking daytime entry", "terrace entry"], False, [4, 5, 10, 11]),
    "Theft": ("BNS 303", ["vehicle theft from parking", "shop till theft", "pickpocketing in transit"], False, []),
    "Cyber Fraud": ("IT Act 66D", ["UPI phishing call", "fake loan app extortion", "OTP social engineering", "courier scam"], True, [1, 2, 3]),
    "Cheating": ("BNS 318", ["investment ponzi scheme", "fake job placement racket", "land document forgery"], True, []),
    "Extortion": ("BNS 308", ["protection money demand", "digital arrest threat call"], True, []),
    "NDPS": ("NDPS Act 20", ["street-level peddling", "courier parcel concealment", "hostel network supply"], False, []),
    "Rioting": ("BNS 191", ["communal flashpoint clash", "protest escalation"], False, [8, 9]),
}

STATUSES = ["under-investigation", "charge-sheeted", "court-pending", "convicted", "closed"]
STATUS_WEIGHTS = [0.30, 0.20, 0.18, 0.20, 0.12]

OUT_DIR = Path(__file__).resolve().parents[3] / ".." / "datasets" / "synthetic_cases"


def generate(out_dir: Path | None = None) -> dict[str, int]:
    rng = random.Random(SEED)
    fake = Faker("en_IN")
    Faker.seed(SEED)

    out = Path(out_dir) if out_dir else OUT_DIR.resolve()
    out.mkdir(parents=True, exist_ok=True)

    # ── Offender pool: some habitual, gangs co-offend ────────────────────
    offenders = []
    for i in range(NUM_OFFENDERS):
        offenders.append({
            "person_id": f"P{i+1:04d}",
            "name": fake.name(),
            "age": rng.randint(18, 60),
            "gender": rng.choice(["male", "male", "male", "female"]),
            "home_district": rng.choice(DISTRICTS),
            # ~20% habitual offenders commit most of the crime volume.
            "weight": 4 if i < NUM_OFFENDERS // 5 else 1,
            "gang": (i % NUM_GANGS) + 1 if i < NUM_GANGS * 6 else None,  # 72 gang members
        })
    offender_weights = [o["weight"] for o in offenders]

    # Hotspot areas per district (reused across cases → shared-location links).
    areas = {d: [f"{fake.street_name()}" for _ in range(4)] for d in DISTRICTS}

    # Shared mule accounts for financial crime (reused → transaction links).
    mule_accounts = [
        {"account_id": f"AC{i+1:04d}", "bank": rng.choice(["SBI", "Canara", "HDFC", "Axis", "Union"]),
         "number_masked": f"XX{rng.randint(1000, 9999)}"}
        for i in range(60)
    ]

    cases_rows, people_rows, account_rows = [], [], []
    start = date(2024, 1, 1)

    for n in range(NUM_CASES):
        crime_type = rng.choice(list(CRIME_PROFILES))
        sections, mos, is_financial, peaks = CRIME_PROFILES[crime_type]

        # Date with seasonal bias: peak months get double probability.
        while True:
            d = start + timedelta(days=rng.randint(0, 730))
            if not peaks or d.month in peaks or rng.random() < 0.5:
                break

        district = rng.choice(DISTRICTS)
        area = rng.choice(areas[district])
        fir = f"FIR-{d.year}-{district[:3].upper()}-{n+1:04d}"
        status = rng.choices(STATUSES, weights=STATUS_WEIGHTS)[0]
        # Older cases are more likely resolved.
        if d.year == 2024 and status == "under-investigation" and rng.random() < 0.6:
            status = rng.choice(["convicted", "closed", "court-pending"])

        cases_rows.append({
            "fir_number": fir,
            "date": d.isoformat(),
            "district": district,
            "area": area,
            "crime_type": crime_type,
            "sections": sections,
            "modus_operandi": rng.choice(mos),
            "status": status,
            "is_synthetic": True,
        })

        # ── Accused: gang crimes pull co-members (co-accused edges) ──────
        # Non-gang co-accused are drawn uniformly from non-gang offenders so
        # gangs stay distinct communities instead of one merged component.
        lead = rng.choices(offenders, weights=offender_weights)[0]
        accused = [lead]
        if lead["gang"] and rng.random() < 0.6:
            mates = [o for o in offenders if o["gang"] == lead["gang"] and o is not lead]
            accused += rng.sample(mates, k=min(rng.randint(1, 2), len(mates)))
        elif not lead["gang"] and rng.random() < 0.2:
            solo_pool = [o for o in offenders if not o["gang"] and o is not lead]
            accused.append(rng.choice(solo_pool))

        seen = set()
        for person in accused:
            if person["person_id"] in seen:
                continue
            seen.add(person["person_id"])
            people_rows.append({
                "fir_number": fir, "person_id": person["person_id"], "name": person["name"],
                "role": "accused", "age": person["age"], "gender": person["gender"],
                "district": person["home_district"], "is_synthetic": True,
            })

        # ── Victims: fresh identities ────────────────────────────────────
        for v in range(rng.randint(1, 2)):
            people_rows.append({
                "fir_number": fir, "person_id": f"V{n+1:04d}{v}", "name": fake.name(),
                "role": "victim", "age": rng.randint(16, 75),
                "gender": rng.choice(["male", "female"]), "district": district,
                "is_synthetic": True,
            })

        # ── Financial links: shared mule accounts ────────────────────────
        if is_financial:
            for acc in rng.sample(mule_accounts, k=rng.randint(1, 2)):
                account_rows.append({
                    "fir_number": fir, "account_id": acc["account_id"],
                    "bank": acc["bank"], "number_masked": acc["number_masked"],
                    "holder_person_id": lead["person_id"], "is_synthetic": True,
                })

    def write(name: str, rows: list[dict]):
        with open(out / name, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)

    write("cases.csv", cases_rows)
    write("case_people.csv", people_rows)
    write("case_accounts.csv", account_rows)
    return {"cases": len(cases_rows), "people": len(people_rows), "accounts": len(account_rows)}


if __name__ == "__main__":
    counts = generate()
    print(f"Generated synthetic case dataset: {counts}")
