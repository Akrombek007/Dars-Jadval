from pydantic import BaseModel

class GroupRequest(BaseModel):
    name: str
    course_id: int