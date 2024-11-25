from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from tenacity import retry, wait_exponential, stop_after_attempt
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import OperationalError
from contextlib import asynccontextmanager
from LoggerService import LoggerService
from typing import Optional, List, Type
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, select
from typing import Optional, Callable
from .config import DATABASE_URL
from asyncio import sleep
import time
from typing import Dict


class DatabaseService:
    """PostgreSQL uchun rivojlangan asinxron ma'lumotlar bazasi xizmati."""
    MAX_RETRIES = 5  # Katta yuklanish uchun qayta urinishlar soni oshirilgan
    ENGINE: Optional[AsyncEngine] = None  # Havza ulanishi (connection pool)

    def __init__(self, logger: LoggerService):
        self.engine = self.get_engine()
        self.logging = logger.get_logger()
        self.session_factory = sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)

    @classmethod
    def get_engine(cls) -> AsyncEngine:
        """Havza ulanishi sozlanadi."""
        if cls.ENGINE is None:
            cls.ENGINE = create_async_engine(
                DATABASE_URL,
                echo=False,
                pool_size=20,  # Yuqori yuklanish uchun sozlangan
                max_overflow=10,
                pool_timeout=30,  # Havza ulanishi timeouti
            )
        return cls.ENGINE

    @asynccontextmanager
    async def session_scope(self):
        """Sessiyani avtomatik boshqarish uchun kontekst menejeri."""
        async with self.get_session() as session:
            async with session.begin():
                try:
                    yield session
                except Exception as e:
                    self.logging.error(f"Session error: {e}", exc_info=True)
                    raise

    def get_session(self) -> AsyncSession:
        """Yangi sessiya ob'ektini qaytaradi."""
        return self.session_factory()

    @retry(wait=wait_exponential(multiplier=1, min=1, max=10), stop=stop_after_attempt(MAX_RETRIES))
    async def execute_query(self, query: Callable, *args, **kwargs):
        """Kirish va tranzaksiyalar uchun qayta urinish mexanizmi bilan umumiy funksiya."""
        start_time = time.time()
        async with self.session_scope() as session:
            try:
                self.logging.info(f"Executing query: {query.__name__}")
                result = await query(session, *args, **kwargs)
                elapsed_time = time.time() - start_time
                self.logging.info(f"Query executed in {elapsed_time:.2f} seconds.")
                return result
            except Exception as e:
                self.logging.error(f"Error executing query: {e}", exc_info=True)
                raise

    async def health_check(self):
        """Ma'lumotlar bazasi sog'ligini tekshirish."""
        try:
            async with self.get_session() as session:
                await session.execute("SELECT 1")
                self.logging.info("Database connection is healthy.")
        except Exception as e:
            self.logging.error(f"Database health check failed: {e}", exc_info=True)
            raise

    async def add(self, instance: SQLModel) -> Optional[int]:
        """
        Yangi obyektni ma'lumotlar bazasiga qo'shadi.
        :param instance: Qo'shiladigan obyekt (SQLModel).
        :return: Obyektning ID'si yoki None (xatolik bo'lsa).
        """
        async with self.session_scope() as session:
            try:
                session.add(instance)
                await session.commit()
                await session.refresh(instance)
                self.logging.info(f"Added instance: {instance}")
                return instance.id
            except Exception as e:
                self.logging.error(f"Error adding instance: {e}", exc_info=True)
                await session.rollback()
                raise

    async def update(self, instance: SQLModel) -> Optional[int]:
        """
        Ma'lumotlar bazasidagi obyektni yangilaydi.
        :param instance: Yangilanishi kerak bo'lgan obyekt (SQLModel).
        :return: Yangilangan obyektning ID'si yoki None (xatolik bo'lsa).
        """
        async with self.session_scope() as session:
            try:
                await session.merge(instance)
                await session.commit()
                await session.refresh(instance)
                self.logging.info(f"Updated instance: {instance}")
                return instance.id
            except Exception as e:
                self.logging.error(f"Error updating instance: {e}", exc_info=True)
                await session.rollback()
                raise

    async def get(
            self,
            model: Type[SQLModel],
            filter_by: Optional[Dict[str, any]] = None,
            limit: Optional[int] = None,
    ) -> List[SQLModel]:
        """
        Jadvaldan yozuvlarni olish uchun umumiy funksiya.
        :param model: SQLModel jadvali turi.
        :param filter_by: Filtlash shartlari (masalan, {"id": 1}).
        :param limit: Qaytariladigan yozuvlar sonini cheklash.
        :return: Model yozuvlari ro'yxati yoki bo'sh ro'yxat.
        """
        async with self.session_scope() as session:
            try:
                query = select(model)

                # Filtlash shartlari qo‘shish
                if filter_by:
                    for key, value in filter_by.items():
                        if hasattr(model, key):
                            query = query.where(getattr(model, key) == value)
                        else:
                            self.logging.warning(
                                f"Invalid filter key: {key} for model {model.__name__}"
                            )

                # Limit parametrini qo‘llash
                if limit:
                    query = query.limit(limit)

                result = await session.execute(query)
                records = result.scalars().all()
                self.logging.info(f"Retrieved {len(records)} records from {model.__name__}")
                return records

            except Exception as e:
                self.logging.error(f"Error retrieving data from {model.__name__}: {e}", exc_info=True)
                raise

    async def add_courses(self, courses: List[Course]) -> List[Optional[int]]:
        try:
            course_id = await self.add(course)
            self.logging.info(f"Successfully added course: {course}")
            return course_id
        except Exception as e:
            self.logging.error(f"Failed to add course: {e}", exc_info=True)
            return None
