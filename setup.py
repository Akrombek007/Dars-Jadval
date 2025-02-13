from setuptools import setup, find_packages

setup(
    name="dars-jadval",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi>=0.100.0,<0.105.0",
        "uvicorn[standard]==0.22.0",
        "pydantic>=2.0,<3.0",
        "sqlalchemy==2.0.36",
        "asyncpg==0.28.0",
        "aiohttp==3.8.6",
        "aiocache==0.12.3",
        "aiogram==2.25.2",
        "magic-filter==1.0.12",
        "python-dotenv==0.21.1",
        "sqlmodel==0.0.16",
        "tenacity==8.2.3",
        "jinja2==3.1.2",
    ],
)
