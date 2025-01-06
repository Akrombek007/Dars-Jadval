from DatabaseService import Course, DatabaseCore, get_db_core, Subject, Group, Schedule
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

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


@router.put("/schedule/{schedule_id}")
async def update_schedule(
    schedule_id: int,
    updated_data: Dict[str, Any],
    db: DatabaseCore = Depends(get_db_core)
):
    """
    Mavjud dars jadvalini yangilash.

    Parameters:
    - schedule_id: Yangilanishi kerak bo'lgan jadval identifikatori
    - updated_data: Yangi ma'lumotlar lug'ati
    - db: Ma'lumotlar bazasi xizmati

    Returns:
    - Yangilangan jadval identifikatori
    """
    try:
        # Ma'lumotlar bazasidan jadvalni olish
        existing_schedules = await db.get(Schedule, filters={"id": schedule_id})

        if not existing_schedules:
            raise HTTPException(
                status_code=404,
                detail=f"ID {schedule_id} ga ega jadval topilmadi"
            )

        schedule_instance = existing_schedules[0]  # Birinchi natija

        # Yangi ma'lumotlarni filtrlash
        allowed_fields = {"room_id", "teacher_id", "subject_id"}
        update_data = {key: value for key, value in updated_data.items() if key in allowed_fields}

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="Yangilash uchun hech qanday ma'lumot berilmagan"
            )

        # Jadvalni yangilash
        schedule_instance.update_from_dict(update_data)

        # DatabaseService1.update funksiyasidan foydalanib yangilash
        updated_id = await db.update(schedule_instance)

        return {
            "message": "Dars jadvali muvaffaqiyatli yangilandi",
            "updated_id": updated_id
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Jadval yangilashda xatolik: {str(e)}"
        )
