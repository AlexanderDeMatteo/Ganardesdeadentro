#!/usr/bin/env python
"""Script para ejecutar la aplicación Flask."""

import os
from app import create_app

if __name__ == '__main__':
    app = create_app()
    
    # Configuración del servidor
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    print(f"\n🚀 Starting server on {host}:{port}")
    print(f"📊 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"🔍 Debug mode: {debug}\n")
    
    app.run(host=host, port=port, debug=debug)
