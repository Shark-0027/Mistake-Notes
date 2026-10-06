from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import Base
from app.seed import database_counts, seed_database, sha256_file

from .conftest import ROOT


def test_seed_is_idempotent_and_dataset_hash_matches(tmp_path: Path) -> None:
    database_path = tmp_path / "seed-test.db"
    engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    Base.metadata.create_all(engine)
    settings = Settings(
        database_url=f"sqlite:///{database_path.as_posix()}",
        dataset_path=ROOT / "data/wrong-answers-20/dataset.json",
        schema_path=ROOT / "data/wrong-answers-20/schema.json",
    )

    with Session(engine) as db:
        first_counts = seed_database(db, settings)
        second_counts = seed_database(db, settings)
        final_counts = database_counts(db)

    assert first_counts == second_counts == final_counts
    assert final_counts == {
        "records": 20,
        "students": 13,
        "courses": 6,
        "assignments": 7,
    }
    assert (
        sha256_file(settings.dataset_path)
        == "2417e5ab9a9417875a4a3755fbedcd05c4d442085217affb80f36e355c6e106b"
    )

