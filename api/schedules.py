from sqlalchemy.orm import relationship

from DatabaseService import Course, DatabaseCore, get_db_core, Subject, Group, Schedule
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Schedules"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.get("/schedule/{course_id}")
async def get_groups_by_course(course_id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        groups = await db.get(Group, {"course_id": course_id})
        if not groups:
            raise HTTPException(status_code=404, detail="No groups found for this course")
        return [{"id": group.id, "name": group.name} for group in groups]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/schedule/")
async def create_schedule(schedule: List[Schedule], db: DatabaseCore = Depends(get_db_core)):
    try:
        added_ids = []
        for sched in schedule:
            schedule_id = await db.add(sched)
            added_ids.append(schedule_id)
        return added_ids  # Return a list of IDs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/table/{course_id}")
async def get_schedule_table(course_id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        relationships = ["group", "course", "subject", "teacher", "room"]
        schedules = await db.get_table(Schedule, {"course_id": course_id}, relationships=relationships)
        return [
            {
                "id": schedule.id,
                "group": {"id": schedule.group_id, "name": schedule.group.name},
                "course": {"id": schedule.course_id, "name": schedule.course.name},
                "subject": {"id": schedule.subject_id, "name": schedule.subject.name},
                "teacher": {"id": schedule.teacher_id, "name": schedule.teacher.name},
                "room": {"id": schedule.room_id, "name": schedule.room.name},
                "day": schedule.day,
                "time_slot": schedule.time_slot,
            }
            for schedule in schedules]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
