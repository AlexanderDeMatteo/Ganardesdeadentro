import logging
import os
import re
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

BRAND_NAME = 'Be a Gainer'
TrainerInviteVariant = Literal['initial', 'resend']

_TEMPLATE_PATH = (
    Path(__file__).resolve().parent.parent / 'templates' / 'emails' / 'trainer_invite.html'
)


class EmailService:
    """Envío de correos vía Resend (o log en desarrollo sin API key)."""

    @staticmethod
    def _frontend_url() -> str:
        return os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')

    @staticmethod
    def _email_from() -> str:
        return os.getenv('EMAIL_FROM', f'{BRAND_NAME} <invitaciones@beagainer.life>')

    @staticmethod
    def _email_reply_to() -> str | None:
        value = os.getenv('EMAIL_REPLY_TO', 'soporte@beagainer.life').strip()
        return value or None

    @staticmethod
    def _invitation_expiry_hours() -> int:
        return int(os.getenv('INVITATION_EXPIRY_HOURS', '72'))

    @staticmethod
    def build_trainer_invite_url(raw_token: str) -> str:
        return f'{EmailService._frontend_url()}/activate?token={raw_token}'

    @staticmethod
    def _load_trainer_invite_template() -> str:
        return _TEMPLATE_PATH.read_text(encoding='utf-8')

    @staticmethod
    def build_trainer_invite_content(
        *,
        first_name: str,
        email: str,
        invite_url: str,
        variant: TrainerInviteVariant = 'initial',
        specialization: str | None = None,
        expiry_hours: int | None = None,
    ) -> tuple[str, str, str]:
        hours = expiry_hours if expiry_hours is not None else EmailService._invitation_expiry_hours()
        safe_first_name = escape(first_name.strip())
        safe_email = escape(email.strip().lower())
        safe_url = escape(invite_url, quote=True)
        year = str(datetime.now(timezone.utc).year)

        if variant == 'resend':
            subject = f'Nuevo enlace para activar tu cuenta en {BRAND_NAME}'
            preheader = 'Tu enlace anterior ya no es válido'
            headline = 'Nuevo enlace de activación'
            intro_paragraph = (
                f'Generamos un enlace nuevo para tu cuenta de entrenador en <strong>{escape(BRAND_NAME)}</strong>. '
                'Si tenías uno anterior, ya no es válido.'
            )
            resend_note = (
                '<p style="margin:0 0 12px;">Usa este correo para activar tu cuenta con el enlace actualizado.</p>'
            )
        else:
            subject = f'Te invitaron a {BRAND_NAME} como entrenador'
            preheader = 'Activa tu cuenta en unos minutos'
            headline = 'Invitación de entrenador'
            intro_paragraph = (
                f'Fuiste invitado a unirte a <strong>{escape(BRAND_NAME)}</strong> como entrenador.'
            )
            resend_note = ''

        specialization_block = ''
        if specialization and specialization.strip():
            safe_spec = escape(specialization.strip())
            specialization_block = (
                f'<p style="margin:0 0 16px;">Especialización registrada: <strong>{safe_spec}</strong>.</p>'
            )

        html = EmailService._load_trainer_invite_template().format(
            subject=escape(subject),
            preheader=escape(preheader),
            brand_name=escape(BRAND_NAME),
            headline=escape(headline),
            first_name=safe_first_name,
            intro_paragraph=intro_paragraph,
            specialization_block=specialization_block,
            invite_url=safe_url,
            email=safe_email,
            expiry_hours=hours,
            resend_note=resend_note,
            year=year,
        )

        spec_line = ''
        if specialization and specialization.strip():
            spec_line = f'Especialización registrada: {specialization.strip()}.\n\n'

        if variant == 'resend':
            intro_plain = (
                f'Generamos un enlace nuevo para tu cuenta de entrenador en {BRAND_NAME}. '
                'Si tenías uno anterior, ya no es válido.\n\n'
            )
        else:
            intro_plain = f'Fuiste invitado a unirte a {BRAND_NAME} como entrenador.\n\n'

        plain = (
            f'Hola {first_name.strip()},\n\n'
            f'{intro_plain}'
            f'{spec_line}'
            'Desde la plataforma podrás:\n'
            '- Gestionar atletas asignados\n'
            '- Crear rutinas y plan semanal\n'
            '- Revisar sesiones y progreso\n'
            '- Asignar planes nutricionales\n\n'
            f'Activa tu cuenta: {invite_url}\n\n'
            f'Al abrir el enlace, crea tu contraseña (mínimo 8 caracteres) y accede con {email.strip().lower()}.\n\n'
            f'Este enlace caduca en {hours} horas. Si expira, pide al administrador que reenvíe la invitación.\n\n'
            'Si no esperabas este correo, puedes ignorarlo con tranquilidad.\n\n'
            f'© {year} {BRAND_NAME} · Ganar desde adentro'
        )

        return subject, html, plain

    @staticmethod
    def send_trainer_invitation(
        to: str,
        first_name: str,
        invite_url: str,
        *,
        variant: TrainerInviteVariant = 'initial',
        specialization: str | None = None,
        expiry_hours: int | None = None,
    ) -> tuple[bool, str]:
        api_key = os.getenv('RESEND_API_KEY', '').strip()
        subject, html, plain = EmailService.build_trainer_invite_content(
            first_name=first_name,
            email=to,
            invite_url=invite_url,
            variant=variant,
            specialization=specialization,
            expiry_hours=expiry_hours,
        )

        if not api_key:
            env = os.getenv('ENVIRONMENT', 'development')
            if env == 'development':
                logger.info(
                    'RESEND_API_KEY no configurada; invitación simulada para %s. '
                    'Enlace de activación (solo desarrollo): %s',
                    to,
                    invite_url,
                )
            else:
                logger.info(
                    'RESEND_API_KEY no configurada; invitación simulada para %s (enlace no registrado en logs)',
                    to,
                )
            return True, ''

        try:
            import resend

            resend.api_key = api_key
            payload: dict[str, object] = {
                'from': EmailService._email_from(),
                'to': [to],
                'subject': subject,
                'html': html,
                'text': plain,
            }
            reply_to = EmailService._email_reply_to()
            if reply_to:
                payload['reply_to'] = reply_to
            resend.Emails.send(payload)
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
