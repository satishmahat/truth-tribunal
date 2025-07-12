"""
Blueprint registration for the Flask app.
"""
from .auth import auth_bp
from .admin import admin_bp
from .news import news_bp

def register_blueprints(app):
    from .admin import admin_bp
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(news_bp, url_prefix='/api') 