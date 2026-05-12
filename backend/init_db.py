"""
Script para inicializar la base de datos.
Crea todas las tablas necesarias.
"""

import os
import sys
from app.database import Base, engine
from app.models import (
    User, UserProfile, Membership, UserMembership, 
    Exercise, Routine, RoutineExercise, 
    UserRoutineAssignment, MetricsHistory
)

def init_database():
    """Inicializa la base de datos creando todas las tablas."""
    print("[*] Inicializando base de datos...")
    
    # Crear todas las tablas basadas en los modelos
    Base.metadata.create_all(bind=engine)
    
    print("[✓] Base de datos inicializada correctamente")
    print("[✓] Todas las tablas han sido creadas")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"[✗] Error al inicializar la base de datos: {e}")
        sys.exit(1)
