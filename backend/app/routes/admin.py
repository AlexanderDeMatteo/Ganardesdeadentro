from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.services.admin_service import AdminService
from app.utils.authorization import role_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/overview', methods=['GET'])
@jwt_required()
@role_required('admin')
def overview():
    data, error = AdminService.get_overview()
    if error:
        return {'error': error}, 500
    return data, 200
