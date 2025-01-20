from DatabaseService import Course, DatabaseCore, get_db_core, Teacher, TeacherInfo
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Teachers"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.get("/teachers/", response_model=List[dict])
async def read_teachers(db: DatabaseCore = Depends(get_db_core)):
    try:
        return [{"id": teacher.id, "name": teacher.name, "sciencename": teacher.sciencename, "classtime": teacher.classtime} for teacher in await db.get(Teacher)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/teachers/")
async def create_teacher(teacher: Teacher, db: DatabaseCore = Depends(get_db_core)):
    try:
        teacher_id = await db.add(teacher)
        if teacher_id:
            teacher.id = teacher_id
            return teacher
        raise HTTPException(status_code=500, detail="Teacher creation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/teachers/{id}", operation_id="delete_teacher_by_id")
async def delete_teacher(id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        deleted_count = await db.delete(Teacher, {"id": id})
        if deleted_count:
            return {"message": "Teacher deleted successfully"}
        raise HTTPException(status_code=404, detail="Teacher not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

