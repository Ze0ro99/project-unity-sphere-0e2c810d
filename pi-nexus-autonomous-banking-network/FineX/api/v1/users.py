# users.py

import os
import secrets
import datetime
from functools import wraps

from flask import Blueprint, request, jsonify, g
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import Schema, fields, ValidationError
import jwt

# Initialize the database
db = SQLAlchemy()

# Create a blueprint for users
users_bp = Blueprint('users', __name__)


# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


# User schema for validation
class UserSchema(Schema):
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


user_schema = UserSchema()
users_schema = UserSchema(many=True)


def _load_secret_key() -> str:
    """Load JWT signing key from the environment.

    Raises RuntimeError at request time if the operator forgot to set it — we
    intentionally never fall back to a hardcoded placeholder, which would allow
    trivial token forgery. Generate a value with `secrets.token_hex(32)` and
    store it in the deployment secret manager as JWT_SECRET_KEY.
    """
    key = os.environ.get('JWT_SECRET_KEY')
    if not key or len(key) < 32:
        raise RuntimeError(
            'JWT_SECRET_KEY environment variable must be set to a random '
            'value of at least 32 characters (e.g. secrets.token_hex(32)).'
        )
    return key


def _decode_token(token: str) -> dict:
    return jwt.decode(token, _load_secret_key(), algorithms=["HS256"])


def require_auth(fn):
    """Decorator: require a valid bearer JWT and expose the user via `g.user`."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer' or not parts[1]:
            return jsonify({'message': 'Missing or malformed Authorization header'}), 401
        try:
            decoded = _decode_token(parts[1])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        user = User.query.get(decoded.get('user_id'))
        if user is None:
            return jsonify({'message': 'Invalid token'}), 401
        g.user = user
        return fn(*args, **kwargs)
    return wrapper


# Route to register a new user
@users_bp.route('/users/register', methods=['POST'])
def register_user():
    try:
        data = user_schema.load(request.json)
        hashed_password = generate_password_hash(data['password'])
        new_user = User(username=data['username'], email=data['email'], password=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return user_schema.jsonify(new_user), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception:
        # Do not leak internal exception details to clients.
        return jsonify({"error": "Registration failed"}), 500


# Route to authenticate a user
@users_bp.route('/users/login', methods=['POST'])
def login_user():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'message': 'Invalid credentials'}), 401
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1),
            },
            _load_secret_key(),
            algorithm="HS256",
        )
        return jsonify({'token': token}), 200
    return jsonify({'message': 'Invalid credentials'}), 401


# Route to get user profile
@users_bp.route('/users/profile', methods=['GET'])
@require_auth
def get_user_profile():
    return user_schema.jsonify(g.user), 200


# Route to update user profile
@users_bp.route('/users/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    data = request.json or {}
    user = g.user
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
    db.session.commit()
    return user_schema.jsonify(user), 200


# Route to delete a user — only the authenticated owner can delete their account.
@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    if g.user.id != user_id:
        return jsonify({"message": "Forbidden"}), 403
    db.session.delete(g.user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully."}), 204


# Register the blueprint in the main application
def init_app(app):
    app.register_blueprint(users_bp, url_prefix='/api/v1')
