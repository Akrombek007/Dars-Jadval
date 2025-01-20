from fastapi import APIRouter, Depends, HTTPException, status, Request
from DatabaseService import Course, Group, get_db_core, DatabaseCore


router = APIRouter(
    prefix="/api",
    tags=["Groups"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.post("/groups/", response_model=Group)
async def create_group(group: Group, db: DatabaseCore = Depends(get_db_core)):
    try:
        group.course_id = int(group.course_id)
        group_id = await db.add(group)
        if group_id:
            group.id = group_id
            return group
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/for/groups", operation_id="read_courses_for_groups")
async def read_courses(db: DatabaseCore = Depends(get_db_core)):
    try:
        raise HTTPException(status_code=status.HTTP_200_OK,
                            detail=[{"id": course.id, "name": f"{course.name} {course.description}"} for course in
                                    await db.get(Course)])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/groups/")
async def read_groups(db: DatabaseCore = Depends(get_db_core)):
    try:
        groups = await db.get(Group)  # Guruhlar ro'yxati
        courses = {course.id: f"{course.name} {course.description}" for course in
                   await db.get(Course)}  # Kurslarni lug'atga o'girish

        # Kurs nomini guruhlarga qo'shib chiqamiz
        return [{"name": group.name, "course_id": courses.get(group.course_id, "Noma'lum")}
                                    for group in groups]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
