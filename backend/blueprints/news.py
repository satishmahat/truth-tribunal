from flask import Blueprint, request, jsonify
from extensions import db
from models import NewsArticle, User
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

news_bp = Blueprint('news', __name__)

@news_bp.route('/news', methods=['GET'])
def get_news():
    articles = NewsArticle.query.order_by(NewsArticle.created_at.desc()).all()
    return jsonify([
        {
            'id': a.id,
            'title': a.title,
            'content': a.content,
            'reporter_id': a.reporter_id,
            'author': (lambda user: user.name if user is not None else None)(User.query.get(a.reporter_id)),
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'cover_image': a.cover_image,
            'category': a.category
        }
        for a in articles
    ])

@news_bp.route('/news', methods=['POST'])
@jwt_required()
def post_news():
    identity = get_jwt_identity()  # This is a string (user id)
    claims = get_jwt()             # This is a dict with your custom claims, including 'role'
    if claims.get('role') != 'reporter':
        return jsonify({'msg': 'Only reporters can post news'}), 403

    data = request.get_json()
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'msg': 'Missing title or content'}), 400

    # The following instantiation is correct: NewsArticle uses SQLAlchemy's default constructor, which accepts field names as kwargs.
    article = NewsArticle(
        title=data['title'],
        content=data['content'],
        reporter_id=int(identity),  # ensure int
        cover_image=data.get('cover_image'),
        category=data.get('category')
    )
    db.session.add(article)
    db.session.commit()
    return jsonify({'msg': 'News posted'}) 

@news_bp.route('/news/<int:article_id>', methods=['GET'])
def get_news_article(article_id):
    article = NewsArticle.query.get_or_404(article_id)
    author = User.query.get(article.reporter_id)
    return jsonify({
        'id': article.id,
        'title': article.title,
        'content': article.content,
        'author': author.name if author is not None else None,
        'created_at': article.created_at.isoformat() if article.created_at else None,
        'cover_image': article.cover_image,
        'category': article.category
    }) 

@news_bp.route('/news/reporter/<int:reporter_id>', methods=['GET'])
def get_news_by_reporter(reporter_id):
    articles = NewsArticle.query.filter_by(reporter_id=reporter_id).order_by(NewsArticle.created_at.desc()).all()
    return jsonify([
        {
            'id': a.id,
            'title': a.title,
            'content': a.content,
            'reporter_id': a.reporter_id,
            'author': (lambda user: user.name if user is not None else None)(User.query.get(a.reporter_id)),
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'cover_image': a.cover_image,
            'category': a.category
        }
        for a in articles
    ]) 

@news_bp.route('/news/<int:article_id>', methods=['DELETE'])
@jwt_required()
def delete_news_article(article_id):
    identity = get_jwt_identity()
    claims = get_jwt()
    article = NewsArticle.query.get_or_404(article_id)
    if claims.get('role') != 'reporter' or int(identity) != article.reporter_id:
        return jsonify({'msg': 'You can only delete your own articles.'}), 403
    db.session.delete(article)
    db.session.commit()
    return jsonify({'msg': 'Article deleted.'}) 