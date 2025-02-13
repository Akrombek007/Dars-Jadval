from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from tenacity import retry, wait_exponential, stop_after_attempt
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker, selectinload
from typing import Optional, List, Type, Dict, Any
from sqlmodel import SQLModel, select, and_
from contextlib import asynccontextmanager
from LoggerService import LoggerService
from .config import DATABASE_URL
from time import time


class DatabaseService1:
    """PostgreSQL uchun rivojlangan asinxron ma'lumotlar bazasi xizmati."""
    MAX_RETRIES = 5
    ENGINE: Optional[AsyncEngine] = None

    def __init__(self, logger: Optional[LoggerService] = None):
        self.engine = self.get_engine()
        self.logging = logger.get_logger() if logger else None
        self.session_factory = sessionmaker(bind=self.engine, class_=AsyncSession, expire_on_commit=False)

    @classmethod
    def get_engine(cls) -> AsyncEngine:
        """Havza ulanishi sozlanadi."""
        if cls.ENGINE is None:
            cls.ENGINE = create_async_engine(
                DATABASE_URL,
                echo=False,
                pool_size=50,  # Increased pool size for higher concurrency
                max_overflow=25,  # Increased max overflow
                pool_timeout=30,  # Reduced pool timeout
                pool_recycle=300,  # Connection recycle time (5 minutes)
                pool_pre_ping=True,  # Enable connection health checks
                connect_args={
                    "server_settings": {
                        "application_name": "DarsJadval",
                        "statement_timeout": "60000",  # 60 seconds timeout for queries
                        "idle_in_transaction_session_timeout": "300000",  # 5 minutes timeout for idle transactions
                    }
                }
            )
        return cls.ENGINE

    @asynccontextmanager
    async def session_scope(self):
        """Sessiyani avtomatik boshqarish uchun kontekst menejeri."""
        async with self.get_session() as session:
            try:
                yield session
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Session error: {e}", exc_info=True)
                await session.rollback()
                raise
            finally:
                await session.close()

    def get_session(self) -> AsyncSession:
        """Yangi sessiya ob'ektini qaytaradi."""
        return self.session_factory()

    @retry(wait=wait_exponential(multiplier=1, min=1, max=10), stop=stop_after_attempt(MAX_RETRIES))
    async def execute_query(self, query: Any, *args, **kwargs):
        """Umumiy so'rovni bajaruvchi funksiya."""
        start_time = time()
        async with self.session_scope() as session:
            try:
                if self.logging:
                    self.logging.info(f"Executing query: {query.__name__ if callable(query) else query}")
                result = await query(session, *args, **kwargs) if callable(query) else await session.execute(query)
                elapsed_time = time() - start_time
                if self.logging:
                    self.logging.info(f"Query executed in {elapsed_time:.2f} seconds.")
                return result
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error executing query: {e}", exc_info=True)
                raise

    async def add(self, instance: SQLModel) -> Optional[int]:
        """Yangi yozuv qo'shadi."""
        async with self.session_scope() as session:
            try:
                session.add(instance)
                await session.commit()
                await session.refresh(instance)
                if self.logging:
                    self.logging.info(f"Added instance: {instance}")
                return instance.id
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error adding instance: {e}", exc_info=True)
                raise

    async def update(self, instance: SQLModel) -> Optional[int]:
        """Mavjud yozuvni yangilaydi."""
        async with self.session_scope() as session:
            try:
                instance = await session.merge(instance)
                await session.commit()
                await session.refresh(instance)
                if self.logging:
                    self.logging.info(f"Updated instance: {instance}")
                return instance.id
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error updating instance: {e}", exc_info=True)
                raise

    async def get(self, model: Type[SQLModel], filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[SQLModel]:
        """
        Jadvaldan yozuvlarni olish.
        :param model: SQLModel jadvali turi.
        :param filters: Filtlash shartlari (masalan, {"id": 1}).
        :param limit: Qaytariladigan yozuvlar soni.
        :return: Model yozuvlari.
        """
        async with self.session_scope() as session:
            try:
                query = select(model)
                if filters:
                    conditions = [getattr(model, key) == value for key, value in filters.items() if hasattr(model, key)]
                    if conditions:
                        query = query.where(and_(*conditions))
                    elif self.logging:
                        self.logging.warning(f"No valid filters applied for model {model.__name__}")

                if limit:
                    query = query.limit(limit)

                result = await session.execute(query)
                records = result.scalars().all()
                if self.logging:
                    self.logging.info(f"Retrieved {len(records)} records from {model.__name__}")
                return records
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error retrieving data from {model.__name__}: {e}", exc_info=True)
                raise

    async def get_for_schedule(self, model: Type[SQLModel], filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> \
    List[SQLModel]:
        """
        Jadvaldan yozuvlarni olish.
        :param model: SQLModel jadvali turi.
        :param filters: Filtlash shartlari (masalan, {"id": 1} yoki {"id": {"not_in": [1, 2]}}).
        :param limit: Qaytariladigan yozuvlar soni.
        :return: Model yozuvlari.
        """
        async with self.session_scope() as session:
            try:
                query = select(model)

                if filters:
                    conditions = []
                    for key, value in filters.items():
                        column = getattr(model, key)
                        if isinstance(value, dict):
                            # Murakkab shartlarni ishlov berish
                            if "not_in" in value:
                                conditions.append(column.not_in(value["not_in"]))
                            else:
                                raise ValueError(f"Unsupported filter operation: {value}")
                        else:
                            conditions.append(column == value)

                    query = query.where(and_(*conditions))

                if limit:
                    query = query.limit(limit)

                result = await session.execute(query)
                records = result.scalars().all()
                if self.logging:
                    self.logging.info(f"Retrieved {len(records)} records from {model.__name__}")
                return records
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error retrieving data from {model.__name__}: {e}", exc_info=True)
                raise

    async def get_table(
            self,
            model: Type[SQLModel],
            filters: Optional[Dict[str, Any]] = None,
            limit: Optional[int] = None,
            relationships: Optional[List[str]] = None  # Eager load uchun qo'shimcha parametr
    ) -> List[SQLModel]:
        """
        Jadvaldan yozuvlarni olish.
        :param model: SQLModel jadvali turi.
        :param filters: Filtlash shartlari (masalan, {"id": 1}).
        :param limit: Qaytariladigan yozuvlar soni.
        :param relationships: Eager loading uchun Relationship maydonlari.
        :return: Model yozuvlari.
        """
        async with self.session_scope() as session:
            try:
                # Asosiy so'rov
                query = select(model)

                # Eager load qilingan munosabatlar
                if relationships:
                    for relation in relationships:
                        query = query.options(selectinload(getattr(model, relation)))

                # Filtrlash shartlari
                if filters:
                    conditions = [getattr(model, key) == value for key, value in filters.items() if hasattr(model, key)]
                    if conditions:
                        query = query.where(and_(*conditions))

                # Limit
                if limit:
                    query = query.limit(limit)

                result = await session.execute(query)
                records = result.scalars().all()
                return records
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error retrieving data from {model.__name__}: {e}", exc_info=True)
                raise

    async def delete(self, model: Type[SQLModel], filters: Dict[str, Any]) -> int:
        """
        Yozuvlarni o'chirish.
        :param model: Model jadvali.
        :param filters: Filtlash shartlari.
        :return: O'chirilgan yozuvlar soni.
        """
        async with self.session_scope() as session:
            try:
                query = select(model)
                conditions = [getattr(model, key) == value for key, value in filters.items() if hasattr(model, key)]
                query = query.where(and_(*conditions))
                result = await session.execute(query)
                records = result.scalars().all()

                if records:
                    for record in records:
                        await session.delete(record)
                    await session.commit()
                    if self.logging:
                        self.logging.info(f"Deleted {len(records)} records from {model.__name__}")
                    return len(records)
                return 0
            except Exception as e:
                if self.logging:
                    self.logging.error(f"Error deleting records from {model.__name__}: {e}", exc_info=True)
                raise