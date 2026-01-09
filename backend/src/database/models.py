from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine('sqlite:///database.db', echo=True)
Base = declarative_base()


class Articles(Base):
    __tablename__ = 'articles'

    id = Column(Integer, primary_key=True)
    date_created = Column(DateTime, default=datetime.now)
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    content = Column(String, nullable=False)


class ArticleQuota(Base):
    __tablename__ = 'quota'

    id = Column(Integer, primary_key=True)
    quota_remaining = Column(Integer, nullable=False, default=50)

Base.metadata.create_all(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()