import os

os.environ.setdefault('ENVIRONMENT', 'testing')

from app.database import SessionLocal, drop_db, init_db
from app.models import RoleEnum, User
from app.services.dev_seed_service import seed_demo_trainers


def test_seed_demo_trainers_creates_three_active_trainers(monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'development')
    drop_db()
    init_db()
    seed_demo_trainers()

    session = SessionLocal()
    try:
        trainers = (
            session.query(User)
            .filter(User.email.like('%@fittrack.demo'), User.role == RoleEnum.TRAINER)
            .all()
        )
        assert len(trainers) == 3
        assert all(t.is_active for t in trainers)
    finally:
        session.close()


def test_seed_demo_trainers_is_idempotent(monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'development')
    drop_db()
    init_db()
    seed_demo_trainers()
    seed_demo_trainers()

    session = SessionLocal()
    try:
        demo_count = (
            session.query(User)
            .filter(User.email.like('%@fittrack.demo'), User.role == RoleEnum.TRAINER)
            .count()
        )
        assert demo_count == 3
    finally:
        session.close()


def test_seed_demo_trainers_skipped_in_testing(monkeypatch):
    monkeypatch.setenv('ENVIRONMENT', 'testing')
    drop_db()
    init_db()

    session = SessionLocal()
    try:
        demo_count = (
            session.query(User)
            .filter(User.email.like('%@fittrack.demo'))
            .count()
        )
        assert demo_count == 0
    finally:
        session.close()
