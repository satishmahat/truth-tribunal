from flask import Flask
from config import Config
from extensions import db, jwt
from blueprints import register_blueprints
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    jwt.init_app(app)
    register_blueprints(app)
    CORS(app, supports_credentials=True, expose_headers=["Authorization"])
    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True) 