from DatabaseService import Course, DatabaseCore, get_db_core, Subject, Group
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


