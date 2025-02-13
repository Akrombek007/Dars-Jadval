from .DatabaseSer import DatabaseService1
from typing import List, Optional
from .models import Course

class DatabaseCore(DatabaseService1):
    async def add_course(self, name: str, description: Optional[str] = None) -> Optional[int]:
        """Bitta kursni qo'shadi."""
        course = Course(name=name, description=description)
        try:
            course_id = await self.execute_query(self.add, course)  # Yangi kursni qo'shish
            self.logging.info(f"Successfully added course: {course}")
            return course_id
        except Exception as e:
            self.logging.error(f"Failed to add course: {e}", exc_info=True)
            return None

async def get_db_core() -> DatabaseCore:
    return DatabaseCore()
