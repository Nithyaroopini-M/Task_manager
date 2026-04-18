## Live Demo

- Frontend: https://taskflow-frontend-v31v.onrender.com
- Backend API: https://taskflow-backend-1of3.onrender.com
- API Docs: https://taskflow-backend-1of3.onrender.com/docs



A full-stack Task Manager built with FastAPI (backend) and plain HTML/CSS/JS (frontend).

## Features
- JWT authentication (register / login)
- Full task CRUD (create, read, update, delete)
- Mark tasks complete / pending
- Pagination and filtering by completion status
- PostgreSQL database

## Project Structure
```
task-manager/
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── dependencies.py
│   │   └── routers/
│   │       ├── auth.py
│   │       └── tasks.py
│   ├── tests/
│   │   └── test_tasks.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── docker-compose.yml
└── README.md
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Random secret for JWT signing |
| `ALGORITHM` | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry (default: 30) |

## Running Locally

### Prerequisites
- Python 3.10+
- PostgreSQL running locally

### 1. Create the database
```sql
CREATE DATABASE taskmanager;
```

### 2. Setup backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# Create .env from example
copy .env.example .env
# Edit .env with your DB credentials and a secret key
```

### 3. Run the backend
```bash
cd backend
uvicorn app.main:app --reload
```
API available at: http://localhost:8000  
Docs at: http://localhost:8000/docs

### 4. Run the frontend
Open `frontend/index.html` directly in your browser, or serve it:
```bash
cd frontend
python -m http.server 3000
```
Frontend at: http://localhost:3000

## Running Tests
```bash
cd backend
pytest tests/ -v
```

## Running with Docker
```bash
# Copy and edit .env first
copy backend\.env.example backend\.env

docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /register | No | Register user |
| POST | /login | No | Login, get JWT |
| POST | /tasks | Yes | Create task |
| GET | /tasks | Yes | List tasks (paginated, filterable) |
| GET | /tasks/{id} | Yes | Get single task |
| PUT | /tasks/{id} | Yes | Update task |
| DELETE | /tasks/{id} | Yes | Delete task |

Query params for `GET /tasks`:
- `?page=1&limit=10` — pagination
- `?completed=true` or `?completed=false` — filter

## Deployment

### Backend (Render)
1. Push to GitHub
2. Create a new Web Service on Render, point to `backend/`
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env`

### Frontend (Render Static Site / Vercel)
1. Deploy `frontend/` as a static site
2. Update `API` constant in `frontend/app.js` to your Render backend URL
