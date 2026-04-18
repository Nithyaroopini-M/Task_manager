# TaskFlow — Task Manager Application

A full-stack Task Manager built with **FastAPI** (backend) and **vanilla HTML/CSS/JavaScript** (frontend). Features JWT authentication, PostgreSQL persistence, pagination, filtering, and a clean responsive UI.

---

## Live Demo

| | URL |
|---|---|
| Frontend | https://taskflow-frontend-v31v.onrender.com |
| Backend API | https://taskflow-backend-1of3.onrender.com |
| API Docs (Swagger) | https://taskflow-backend-1of3.onrender.com/docs |

> Note: The backend is hosted on Render's free tier and may take 30–50 seconds to wake up after a period of inactivity. Subsequent requests will be fast.

---

## Features

- User registration and login with JWT-based authentication
- Passwords hashed with bcrypt
- Full task CRUD — create, view, update, delete
- Mark tasks as complete or pending
- Pagination (`?page=1&limit=10`)
- Filter by completion status (`?completed=true`)
- Users can only access their own tasks
- Responsive UI that works on desktop and mobile
- Interactive API documentation via Swagger UI (`/docs`)

---

## Project Structure

```
task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, router registration
│   │   ├── config.py          # Environment variable settings
│   │   ├── database.py        # SQLAlchemy engine and session
│   │   ├── models.py          # User and Task database models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT creation, bcrypt hashing
│   │   ├── dependencies.py    # get_current_user dependency
│   │   └── routers/
│   │       ├── auth.py        # POST /register, POST /login
│   │       └── tasks.py       # Full task CRUD endpoints
│   ├── tests/
│   │   └── test_tasks.py      # pytest test suite (11 tests)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── runtime.txt
│   └── .env.example
├── frontend/
│   ├── index.html             # Single-page application
│   ├── style.css              # All styles
│   └── app.js                 # API calls and DOM logic
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive JWT token |
| POST | `/tasks` | Yes | Create a new task |
| GET | `/tasks` | Yes | List all tasks (paginated, filterable) |
| GET | `/tasks/{id}` | Yes | Get a specific task |
| PUT | `/tasks/{id}` | Yes | Update a task |
| DELETE | `/tasks/{id}` | Yes | Delete a task |

### Query Parameters for `GET /tasks`

| Parameter | Type | Example | Description |
|---|---|---|---|
| `page` | integer | `?page=2` | Page number (default: 1) |
| `limit` | integer | `?limit=10` | Items per page (default: 5, max: 100) |
| `completed` | boolean | `?completed=true` | Filter by completion status |

---

## Environment Variables

Create a `.env` file inside the `backend/` directory based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Secret key used to sign JWT tokens |
| `ALGORITHM` | JWT signing algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry duration in minutes |

---

## Running Locally

### Prerequisites

- Python 3.11+
- PostgreSQL installed and running

### 1. Clone the repository

```bash
git clone https://github.com/Nithyaroopini-M/Task_manager.git
cd Task_manager
```

### 2. Create the database

```sql
CREATE DATABASE taskmanager;
```

### 3. Set up the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Edit `.env` and fill in your PostgreSQL credentials and a secret key.

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

API is now running at: http://localhost:8000
Swagger docs at: http://localhost:8000/docs

### 6. Open the frontend

Open `frontend/index.html` directly in your browser, or serve it locally:

```bash
cd frontend
python -m http.server 3000
```

Frontend at: http://localhost:3000

---

## Running with Docker

```bash
# Copy and configure .env first
copy backend\.env.example backend\.env

# Start backend + PostgreSQL
docker-compose up --build
```

---

## Running Tests

```bash
cd backend
venv\Scripts\activate   # or source venv/bin/activate on Mac/Linux
pytest tests/ -v
```

The test suite uses an in-memory SQLite database and covers:

- User registration
- Duplicate registration prevention
- Login with correct and incorrect credentials
- Task creation, listing, filtering, retrieval, update, deletion
- Authorization — users cannot access other users' tasks

---

## Deployment

### Backend — Render Web Service

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Set the following:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`)
6. Deploy

### Frontend — Render Static Site

1. Go to [render.com](https://render.com) → New → Static Site
2. Connect the same GitHub repository
3. Set:
   - Root Directory: `frontend`
   - Publish Directory: `.`
   - Build Command: *(leave empty)*
4. Deploy

### Database — Neon (Free PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string and use it as `DATABASE_URL` in Render environment variables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL, SQLAlchemy ORM |
| Authentication | JWT (python-jose), bcrypt (passlib) |
| Validation | Pydantic v2 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Testing | pytest, httpx |
| Deployment | Render (backend + frontend), Neon (database) |
| Containerization | Docker, Docker Compose |
