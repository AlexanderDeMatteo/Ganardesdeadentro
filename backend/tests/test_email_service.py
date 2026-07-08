import os
from unittest.mock import MagicMock, patch

import pytest

from app.services.email_service import BRAND_NAME, EmailService


class TestEmailService:
    def test_build_trainer_invite_url_uses_frontend_url(self, monkeypatch):
        monkeypatch.setenv('FRONTEND_URL', 'https://app.example.com')
        url = EmailService.build_trainer_invite_url('abc123')
        assert url == 'https://app.example.com/activate?token=abc123'

    def test_build_trainer_invite_content_initial(self):
        subject, html, plain = EmailService.build_trainer_invite_content(
            first_name='Ana',
            email='ana@example.com',
            invite_url='https://app.example.com/activate?token=abc',
            variant='initial',
            specialization='Fuerza',
            expiry_hours=48,
        )
        assert BRAND_NAME in subject
        assert 'entrenador' in subject.lower()
        assert 'Ana' in html
        assert 'ana@example.com' in html
        assert 'https://app.example.com/activate?token=abc' in html
        assert 'Fuerza' in html
        assert '48 horas' in html
        assert BRAND_NAME in plain
        assert 'https://app.example.com/activate?token=abc' in plain
        assert 'Fuerza' in plain

    def test_build_trainer_invite_content_resend(self):
        subject_initial, _, _ = EmailService.build_trainer_invite_content(
            first_name='Ana',
            email='ana@example.com',
            invite_url='https://app.example.com/activate?token=abc',
            variant='initial',
        )
        subject_resend, html, plain = EmailService.build_trainer_invite_content(
            first_name='Ana',
            email='ana@example.com',
            invite_url='https://app.example.com/activate?token=xyz',
            variant='resend',
        )
        assert subject_resend != subject_initial
        assert 'Nuevo enlace' in subject_resend
        assert 'ya no es válido' in html
        assert 'ya no es válido' in plain

    def test_build_trainer_invite_content_expiry_from_env(self, monkeypatch):
        monkeypatch.setenv('INVITATION_EXPIRY_HOURS', '24')
        _, html, plain = EmailService.build_trainer_invite_content(
            first_name='Ana',
            email='ana@example.com',
            invite_url='https://app.example.com/activate?token=abc',
        )
        assert '24 horas' in html
        assert '24 horas' in plain

    def test_send_trainer_invitation_without_api_key(self, monkeypatch):
        monkeypatch.delenv('RESEND_API_KEY', raising=False)
        sent, error = EmailService.send_trainer_invitation(
            to='trainer@example.com',
            first_name='Ana',
            invite_url='https://app.example.com/activate?token=abc',
        )
        assert sent is True
        assert error == ''

    @patch('resend.Emails.send')
    def test_send_trainer_invitation_with_api_key(self, mock_send, monkeypatch):
        monkeypatch.setenv('RESEND_API_KEY', 're_test_key')
        mock_send.return_value = MagicMock()
        sent, error = EmailService.send_trainer_invitation(
            to='trainer@example.com',
            first_name='Ana',
            invite_url='https://app.example.com/activate?token=abc',
            variant='resend',
            specialization='Cardio',
        )
        assert sent is True
        assert error == ''
        mock_send.assert_called_once()
        payload = mock_send.call_args[0][0]
        assert payload['to'] == ['trainer@example.com']
        assert BRAND_NAME in payload['subject']
        assert 'Nuevo enlace' in payload['subject']
        assert BRAND_NAME in payload['html']
        assert 'trainer@example.com' in payload['text']
        assert 'https://app.example.com/activate?token=abc' in payload['text']
        assert 'Cardio' in payload['html']
        assert payload['reply_to'] == 'soporte@beagainer.life'

    @patch('resend.Emails.send')
    def test_send_trainer_invitation_without_reply_to(self, mock_send, monkeypatch):
        monkeypatch.setenv('RESEND_API_KEY', 're_test_key')
        monkeypatch.setenv('EMAIL_REPLY_TO', '')
        mock_send.return_value = MagicMock()
        EmailService.send_trainer_invitation(
            to='trainer@example.com',
            first_name='Ana',
            invite_url='https://app.example.com/activate?token=abc',
        )
        payload = mock_send.call_args[0][0]
        assert 'reply_to' not in payload

    @patch('resend.Emails.send', side_effect=RuntimeError('network'))
    def test_send_trainer_invitation_resend_failure(self, _mock_send, monkeypatch):
        monkeypatch.setenv('RESEND_API_KEY', 're_test_key')
        sent, error = EmailService.send_trainer_invitation(
            to='trainer@example.com',
            first_name='Ana',
            invite_url='https://app.example.com/activate?token=abc',
        )
        assert sent is False
        assert 'correo' in error.lower()

    def test_extract_email_address(self):
        assert EmailService.extract_email_address('Be a Gainer <onboarding@example.com>') == 'onboarding@example.com'
        assert EmailService.extract_email_address('onboarding@example.com') == 'onboarding@example.com'
        assert EmailService.extract_email_address('invalid') is None
