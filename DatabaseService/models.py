from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Union
from datetime import datetime
from pytz import timezone
from json import dumps


class BaseModel(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_date: str = Field(default_factory=lambda: datetime.now(timezone('Asia/Tashkent')).strftime("%d:%m:%y"),
                              description="Yaratilgan vaqt")
    created_time: str = Field(default_factory=lambda: datetime.now(timezone('Asia/Tashkent')).strftime("%H:%M:%S"),
                              description="Yaratilgan vaqt")

    def to_dict(self) -> dict:
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}

    def to_json(self) -> str:
        """Ob'ektni JSON formatiga o'tkazadi."""
        return dumps(self.to_dict(), ensure_ascii=False, indent=4)

    def update_from_dict(self, data: dict) -> None:
        """
        Ob'ekt maydonlarini berilgan lug'at asosida yangilaydi.
        Faqat mavjud maydonlar yangilanadi.
        """
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def __repr__(self) -> str:
        """Ob'ektni string formatida taqdim etadi."""
        return f"<{self.__class__.__name__}(id={self.id}, created_date={self.created_date}, created_time={self.created_time})>"

    @classmethod
    def find_by_id(cls, session, obj_id: int) -> Union["BaseModel", None]:
        """
        Berilgan `id` bo‘yicha obyektni qaytaradi.
        """
        return session.query(cls).filter(cls.id == obj_id, cls.is_active == True).first()


# Kurs modeli
class Course(BaseModel, table=True):
    __tablename__ = 'courses'
    name: str = Field(..., description="Kurs nomi")
    description: Optional[str] = Field(None, description="Kurs haqida tavsif")
    groups: List["Group"] = Relationship(back_populates="course")  # Kursdagi guruhlar


# Guruh modeli
class Group(BaseModel, table=True):
    __tablename__ = 'groups'
    name: str = Field(..., description="Guruh nomi")
    course_id: int = Field(foreign_key="courses.id", description="Kurs identifikatori")
    course: Course = Relationship(back_populates="groups")


# O'qituvchi modeli
class Teacher(BaseModel, table=True):
    __tablename__ = 'teachers'
    name: str = Field(..., description="O'qituvchi ismi")
    sciencename: str = Field(None, description="O'qituvchi fani nomi")
    classtime: str = Field(None, description="O'qituvchi vaqti")


class TeacherInfo(BaseModel, table=True):
    __tablename__ = 'teacher_infos'
    teacher_id: int = Field(foreign_key="teachers.id", description="O'qituvchi identifikatori")
    name: str = Field(..., description="O'qituvchi ismi")
    subject_name: str = Field(None, description="Fan nomi")
    subject_number: str = Field(None, description="Fanlar soni")


class Subject(BaseModel, table=True):
    """
    Fanlar modeli (masalan: matematika, fizika).
    """
    __tablename__ = "subjects"
    name: str = Field(..., description="Fan nomi")
    subject_type: str = Field(..., description="Fan turi")
    course_id: Optional[str] = Field(None, description="Fan tavsifi")
    course_name: Optional[str] = Field(None, description="Kurs nomi")


class LessonType(BaseModel, table=True):
    """
    Dars turi modeli (masalan: ma'ruza, amaliyot).
    """
    __tablename__ = "lesson_types"
    name: str = Field(..., description="Dars turi nomi")  # Masalan, Ma'ruza yoki Amaliyot

# Xona modeli
class Room(BaseModel, table=True):
    __tablename__ = 'rooms'
    name: str = Field(..., description="Xona nomi")
    roomstype: str = Field(..., description="Xona turi")


class Timetable(BaseModel, table=True):
    __tablename__ = 'timetables'
    sciencetime: str = Field(..., description="Kunlik dars o'tish vaqtlari")
    # paratime: str = Field(..., description="Kunlik dars o'tish vaqtlari")


class Week(BaseModel, table=True):
    __tablename__ = 'weeks'
    day: str = Field(..., description="Kun")
    day_number: int = Field(..., description="Xafta kuni raqami")

