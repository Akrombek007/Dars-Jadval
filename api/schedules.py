from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/api/v1/schedules",
    tags=["Schedules"]
)


@router.get("/", response_model=List[schemas.ClassSchedule])
async def get_class_schedules(db: Session = Depends(get_db)):
    class_schedules = db.query(models.ClassSchedule).all()
    return class_schedules


@router.post("/", response_model=schemas.ClassSchedule)
async def create_class_schedule(
        class_schedule: schemas.ClassScheduleCreate,
        db: Session = Depends(get_db)
):
    db_class_schedule = models.ClassSchedule(**class_schedule.dict())
    db.add(db_class_schedule)
    db.commit()
    db.refresh(db_class_schedule)
    return db_class_schedule


@router.get("/{class_schedule_id}", response_model=schemas.ClassSchedule)
async def get_class_schedule(
        class_schedule_id: int,
        db: Session = Depends(get_db)
):
    class_schedule = db.query(models.ClassSchedule).filter(
        models.ClassSchedule.id == class_schedule_id
    ).first()
    if not class_schedule:
        raise HTTPException(
            status_code=404,
            detail="Class schedule not found"
        )
    return class_schedule