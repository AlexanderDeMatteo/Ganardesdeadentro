import logging
import os
import re

logger = logging.getLogger(__name__)


class EmailService:
    """Envío de correos vía Resend (o log en desarrollo sin API key)."""

    @staticmethod
    def _frontend_url() -> str:
        return os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

    @staticmethod
    def _email_from() -> str:
        return os.getenv('EMAIL_FROM', 'FitTrack <onboarding@fittrack.local>')

    @staticmethod
    def build_trainer_invite_url(raw_token: str) -> str:
        return f'{EmailService._frontend_url()}/activate?token={raw_token}'

    @staticmethod
    def send_trainer_invitation(to: str, first_name: str, invite_url: str) -> tuple[bool, str]:
        api_key = os.getenv('RESEND_API_KEY', '').strip()
        subject = 'Activa tu cuenta de entrenador en FitTrack'
        html = (
            f'<p>Hola {first_name},</p>'
            f'<p>Has sido invitado a unirte a FitTrack como entrenador.</p>'
            f'<p><a href="{invite_url}">Activar cuenta</a></p>'
            f'<p>Este enlace expira en 72 horas.</p>'
            f'<p>Si no esperabas este correo, puedes ignorarlo.</p>'
        )

        if not api_key:
            logger.info(
                'RESEND_API_KEY no configurada; invitación simulada para %s (enlace no registrado en logs)',
                to,
            )
            return True, ''

        try:
            import resend

            resend.api_key = api_key
            resend.Emails.send({
                'from': EmailService._email_from(),
                'to': [to],
                'subject': subject,
                'html': html,
            })
            return True, ''
        except Exception:
            logger.exception('Error enviando invitación a %s', to)
            return False, 'No se pudo enviar el correo de invitación'

    @staticmethod
    def extract_email_address(from_header: str) -> str | None:
        match = re.search(r'<([^>]+)>', from_header)
        if match:
            return match.group(1)
        if '@' in from_header:
            return from_header.strip()
        return None
