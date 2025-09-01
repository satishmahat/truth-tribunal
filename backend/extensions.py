from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from services.email_service import mail

db = SQLAlchemy()
jwt = JWTManager() 