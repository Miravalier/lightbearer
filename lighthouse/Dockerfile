FROM python:3.10-alpine

RUN pip install aiohttp

WORKDIR /app

COPY lighthouse.py .

ENV PYTHONUNBUFFERED=1
CMD ["python3", "lighthouse.py"]
