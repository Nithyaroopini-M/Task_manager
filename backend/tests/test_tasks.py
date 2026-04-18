import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Use in-memory SQLite for tests
TEST_DB_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)

USER = {"username": "testuser", "email": "test@example.com", "password": "secret123"}


def get_token():
    client.post("/register", json=USER)
    res = client.post("/login", json={"username": USER["username"], "password": USER["password"]})
    return res.json()["access_token"]


def auth_headers():
    return {"Authorization": f"Bearer {get_token()}"}


# --- Auth tests ---
def test_register():
    res = client.post("/register", json=USER)
    assert res.status_code == 201
    assert res.json()["username"] == USER["username"]


def test_register_duplicate():
    client.post("/register", json=USER)
    res = client.post("/register", json=USER)
    assert res.status_code == 400


def test_login_success():
    client.post("/register", json=USER)
    res = client.post("/login", json={"username": USER["username"], "password": USER["password"]})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_wrong_password():
    client.post("/register", json=USER)
    res = client.post("/login", json={"username": USER["username"], "password": "wrong"})
    assert res.status_code == 401


# --- Task tests ---
def test_create_task():
    headers = auth_headers()
    res = client.post("/tasks", json={"title": "Buy milk"}, headers=headers)
    assert res.status_code == 201
    assert res.json()["title"] == "Buy milk"
    assert res.json()["completed"] is False


def test_list_tasks():
    headers = auth_headers()
    client.post("/tasks", json={"title": "Task 1"}, headers=headers)
    client.post("/tasks", json={"title": "Task 2"}, headers=headers)
    res = client.get("/tasks", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 2


def test_filter_completed():
    headers = auth_headers()
    r = client.post("/tasks", json={"title": "Task A"}, headers=headers)
    task_id = r.json()["id"]
    client.put(f"/tasks/{task_id}", json={"completed": True}, headers=headers)
    client.post("/tasks", json={"title": "Task B"}, headers=headers)

    res = client.get("/tasks?completed=true", headers=headers)
    assert res.json()["total"] == 1


def test_get_task():
    headers = auth_headers()
    r = client.post("/tasks", json={"title": "My task"}, headers=headers)
    task_id = r.json()["id"]
    res = client.get(f"/tasks/{task_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == task_id


def test_update_task():
    headers = auth_headers()
    r = client.post("/tasks", json={"title": "Old title"}, headers=headers)
    task_id = r.json()["id"]
    res = client.put(f"/tasks/{task_id}", json={"title": "New title", "completed": True}, headers=headers)
    assert res.status_code == 200
    assert res.json()["title"] == "New title"
    assert res.json()["completed"] is True


def test_delete_task():
    headers = auth_headers()
    r = client.post("/tasks", json={"title": "Delete me"}, headers=headers)
    task_id = r.json()["id"]
    res = client.delete(f"/tasks/{task_id}", headers=headers)
    assert res.status_code == 204
    res2 = client.get(f"/tasks/{task_id}", headers=headers)
    assert res2.status_code == 404


def test_cannot_access_other_users_task():
    headers = auth_headers()
    r = client.post("/tasks", json={"title": "Private"}, headers=headers)
    task_id = r.json()["id"]

    # Register second user
    client.post("/register", json={"username": "user2", "email": "u2@example.com", "password": "pass2"})
    res2 = client.post("/login", json={"username": "user2", "password": "pass2"})
    headers2 = {"Authorization": f"Bearer {res2.json()['access_token']}"}

    res = client.get(f"/tasks/{task_id}", headers=headers2)
    assert res.status_code == 404
