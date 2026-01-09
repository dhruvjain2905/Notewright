from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from . import models


def get_articles(db: Session):
    return db.query(models.Articles).all()

def get_article_quota(db: Session):
    return db.query(models.ArticleQuota).first()

def add_article(db: Session, title: str, subtitle: str, subject: str, content: str):
    db_article = models.Articles(
        title=title,
        subtitle=subtitle,
        subject=subject,
        content=content
    )
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article