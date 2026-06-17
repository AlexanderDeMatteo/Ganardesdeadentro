"""Tests para utilidades del seed QA (planes de membresía)."""
import importlib.util
import os
import sys

import pytest

from app.database import SessionLocal
from app.models import Membership
from app.services.membership_service import MembershipService

# Cargar el script sin ejecutar main
_SCRIPT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'scripts',
    'seed_qa_dataset.py',
)
_spec = importlib.util.spec_from_file_location('seed_qa_dataset', _SCRIPT_PATH)
_seed = importlib.util.module_from_spec(_spec)
sys.modules['seed_qa_dataset'] = _seed
assert _spec.loader is not None
_spec.loader.exec_module(_seed)


@pytest.fixture
def db_session(client, app):
    with app.app_context():
        yield SessionLocal()


def test_ensure_membership_plans_updates_stale_functional_tier(db_session):
    plan, err = MembershipService.create_plan(
        {
            'name': 'Premium',
            'functionalTier': 'basic',
            'description': 'Legacy plan',
            'price': 9.99,
            'features': [],
        },
        session=db_session,
    )
    assert not err
    assert plan['functionalTier'] == 'basic'

    created, updated = _seed.ensure_membership_plans()

    assert 'Premium' not in created
    assert 'Premium' in updated

    refreshed = db_session.query(Membership).filter_by(name='Premium', is_active=True).first()
    assert refreshed is not None
    assert refreshed.functional_tier == 'premium'


def test_ensure_membership_plans_creates_missing_plans(db_session):
    created, updated = _seed.ensure_membership_plans()

    assert 'Básica' in created
    assert 'Premium' in created
    assert 'Pro' in created
    assert updated == []

    created_again, updated_again = _seed.ensure_membership_plans()
    assert created_again == []
    assert updated_again == []
