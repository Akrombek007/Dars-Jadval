from DatabaseService import Course, DatabaseCore, get_db_core, Subject
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Subjects"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.get("/subjects/", response_model=List[dict])
async def read_subjects(db: DatabaseCore = Depends(get_db_core)):
    try:
        return [{"id": subject.id, "name": subject.name, "subject_type": subject.subject_type, "course_name": subject.course_name}
                for subject in await db.get(Subject)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subjects/", response_model=Subject)
async def create_subject(subject: Subject, db: DatabaseCore = Depends(get_db_core)):
    try:
        subject_id = await db.add(subject)
        if subject_id:
            subject.id = subject_id
            return subject
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/subjects/{id}", response_model=dict)
async def delete_subject(id: int, db: DatabaseCore = Depends(get_db_core)):  # 'id' bilan bir xil qildik
    try:
        deleted_count = await db.delete(Subject, {"id": id})  # DELETE uchun mos nom
        if deleted_count:
            return {"message": "Subject deleted successfully"}  # DELETE muvaffaqiyatli
        raise HTTPException(status_code=404, detail="Subject not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))