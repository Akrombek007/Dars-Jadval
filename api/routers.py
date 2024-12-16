from fastapi import APIRouter
from .courses import router as courses_router
from .groups import router as groups_router
from .subject import router as subject_router
from .teachers import router as teachers_router
from .rooms_api import router as rooms_router
from .schedules import router as schedules_router

router = APIRouter()

router.include_router(courses_router)
router.include_router(groups_router)
router.include_router(subject_router)
router.include_router(teachers_router)
router.include_router(rooms_router)
router.include_router(schedules_router)

__all__ = ["router"]