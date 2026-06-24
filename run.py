import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Development server only – production uses Gunicorn (see deploy/gunicorn.service)
    is_production = os.environ.get('FLASK_ENV') == 'production'
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=not is_production,
    )
