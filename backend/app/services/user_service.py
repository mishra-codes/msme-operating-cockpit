from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class UserService:
    @staticmethod
    def get_all_users(db: Session):
        return db.query(User).all()

    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(
        db: Session,
        user: UserCreate,
        password_hash: str,
    ):
        db_user = User(
            name=user.name,
            email=user.email,
            password_hash=password_hash,
            role=user.role,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    @staticmethod
    def delete_user(
        db: Session,
        user_id: int,
    ):
        user = db.query(User).filter(User.id == user_id).first()

        if user is None:
            return None

        db.delete(user)
        db.commit()

        return user