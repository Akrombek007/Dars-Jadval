from DatabaseService import Course, DatabaseCore, get_db_core
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Courses"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.post("/courses/", response_model=Course)
async def create_course(course: Course, db: DatabaseCore = Depends(get_db_core)):
    try:
        course_id = await db.add(course)
        if course_id:
            course.id = course_id
            return course
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/", response_model=List[dict])
async def read_courses(db: DatabaseCore = Depends(get_db_core)):
    """
    Get all courses.
    Returns a list of Course objects.
    """
    try:
        # Get all courses from the database
        courses = await db.get(Course)
        # Return a list of dictionaries containing the name and description of each course
        return [{"name": course.name, "description": course.description} for course in courses]
    except Exception as e:
        # If an error occurs, raise an HTTPException with a 500 status code
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/for/groups")
async def read_courses(db: DatabaseCore = Depends(get_db_core)):
    try:
        return [{"id": course.id, "name": f"{course.name} {course.description}"} for course in await db.get(Course)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/courses/{course_id}", response_model=Course)
async def update_course(course_id: int, course: Course, db: DatabaseCore = Depends(get_db_core)):
    try:
        course.id = course_id
        updated_id = await db.update(course)
        if updated_id:
            return course # Return the updated course
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/courses/{course_id}")
async def delete_course(course_id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        deleted_count = await db.delete(Course, {"id": course_id})
        if deleted_count:
            raise HTTPException(status_code=status.HTTP_200_OK, detail= {"message": "Course deleted successfully"})
        raise HTTPException(status_code=404, detail="Course not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


'''
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from DatabaseService import Group, DatabaseCore
from sqlalchemy.orm import Session
from pydantic import BaseModel

# DatabaseCore classini import qilib olamiz
db_core = DatabaseCore()

# get_db_core dependency funksiyasi
async def get_db_core():
    return db_core

# Group pydantic modelini yaratish
class GroupIn(BaseModel):
    name: str
    course_id: int

class GroupOut(GroupIn):
    id: int

# Group endpointlarini classda tashkil qilish
class GroupAPI:
    def __init__(self, db: DatabaseCore):
        self.db = db
        self.router = APIRouter(
            prefix="/groups",
            tags=["Groups"],
            dependencies=[Depends(get_db_core)],
            responses={404: {"description": "Not found"}},
        )
        self.router.add_api_route("/", self.read_groups, methods=["GET"])
        self.router.add_api_route("/", self.create_group, methods=["POST"])
        self.router.add_api_route("/for/courses", self.read_groups_for_courses, methods=["GET"])
        self.router.add_api_route("/{group_id}", self.update_group, methods=["PUT"])
        self.router.add_api_route("/{group_id}", self.delete_group, methods=["DELETE"])

    async def create_group(self, group: GroupIn, db: DatabaseCore = Depends(get_db_core)):
        try:
            new_group = Group(name=group.name, course_id=group.course_id)
            group_id = await db.add(new_group)
            if group_id:
                new_group.id = group_id
                return new_group
            raise HTTPException(status_code=500, detail="Failed to create group")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def read_groups(self, db: DatabaseCore = Depends(get_db_core)):
        try:
            groups = await db.get(Group)
            return [GroupOut(id=group.id, name=group.name, course_id=group.course_id) for group in groups]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def read_groups_for_courses(self, db: DatabaseCore = Depends(get_db_core)):
        try:
            groups = await db.get(Group)
            return [
                {"id": group.id, "name": f"{group.name} (Course ID: {group.course_id})"}
                for group in groups
            ]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def update_group(self, group_id: int, group: GroupIn, db: DatabaseCore = Depends(get_db_core)):
        try:
            existing_group = await db.get(Group, {"id": group_id})
            if existing_group:
                existing_group.name = group.name
                existing_group.course_id = group.course_id
                await db.update(existing_group)
                return existing_group
            raise HTTPException(status_code=404, detail="Group not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_group(self, group_id: int, db: DatabaseCore = Depends(get_db_core)):
        try:
            deleted_count = await db.delete(Group, {"id": group_id})
            if deleted_count:
                return {"message": "Group deleted successfully"}
            raise HTTPException(status_code=404, detail="Group not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# GroupAPI classining instansiyasini yaratish va routerni qo‘shish
group_api = GroupAPI(db=db_core)

'''
