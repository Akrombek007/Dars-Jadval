FROM python:3.7

WORKDIR /code

COPY ./ /code/

RUN --mount=type=cache,target=/root/.cache/pip install -r requirements.txt
CMD ["sh", "-c", "python app.py"]
