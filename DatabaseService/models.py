from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from pytz import timezone


class BaseModel(SQLModel):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_date: str = Field(default_factory=lambda: datetime.now(timezone('Asia/Tashkent')).strftime("%d:%m:%y"),
                              description="Yaratilgan vaqt")
    created_time: str = Field(default_factory=lambda: datetime.now(timezone('Asia/Tashkent')).strftime("%H:%M:%S"),
                              description="Yaratilgan vaqt")

    def to_dict(self) -> dict:
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}


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
    sciencename: str = Field(..., description="O'qituvchi fani nomi")
    classtime: str = Field(..., description="O'qituvchi vaqti")


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


class ClassSchedule(BaseModel, table=True):
    __tablename__ = 'class_schedules'
    course_id: int = Field(foreign_key="courses.id", description="Kurs identifikatori")
    course: "Course" = Relationship(back_populates="class_schedules")
    group_id: int = Field(foreign_key="groups.id", description="Guruh identifikatori")
    group: "Group" = Relationship(back_populates="class_schedules")
    teacher_id: int = Field(foreign_key="teachers.id", description="O'qituvchi identifikatori")
    teacher: "Teacher" = Relationship()
    room_id: int = Field(foreign_key="rooms.id", description="Xona identifikatori")
    room: "Room" = Relationship()
    week_id: int = Field(foreign_key="weeks.id", description="Hafta kunining identifikatori")
    week: "Week" = Relationship()
    para_id: int = Field(foreign_key="timetables.id", description="Dars vaqtining identifikatori")
    para: "Timetable" = Relationship()

    @staticmethod
    def is_teacher_conflict(session, teacher_id: int, week_id: int, para_id: int) -> bool:
        """O'qituvchi uchun konfliktni tekshirish."""
        conflict = session.query(ClassSchedule).filter(
            ClassSchedule.teacher_id == teacher_id,
            ClassSchedule.week_id == week_id,
            ClassSchedule.para_id == para_id
        ).first()
        return conflict is not None

    @staticmethod
    def is_room_conflict(session, room_id: int, week_id: int, para_id: int) -> bool:
        """Xona uchun konfliktni tekshirish."""
        conflict = session.query(ClassSchedule).filter(
            ClassSchedule.room_id == room_id,
            ClassSchedule.week_id == week_id,
            ClassSchedule.para_id == para_id
        ).first()
        return conflict is not None