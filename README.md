# Task Management Application

A full-stack task management app built with:

- React + Vite
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- Socket.IO real-time task updates
- Responsive CSS for desktop and mobile

## Requirements

- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas connection string
- Visual Studio Code (or another IDE)

## Project structure

```text
task-management-app/
  backend/
    src/
      config/db.js
      middleware/auth.js
      models/User.js
      models/Task.js
      routes/auth.routes.js
      routes/task.routes.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      components/Navbar.jsx
      components/ProtectedRoute.jsx
      context/AuthContext.jsx
      pages/Login.jsx
      pages/Register.jsx
      pages/Dashboard.jsx
      App.jsx
      api.js
      main.jsx
      styles.css
    .env.example
    index.html
    package.json
    vite.config.js
```

## 1. Start MongoDB

For a local MongoDB installation, make sure MongoDB is running.

Default local connection:

```text
mongodb://127.0.0.1:27017/task_manager
```

Or use MongoDB Atlas and put your connection string in `backend/.env`.

## 2. Backend

Open a terminal in `backend`:

```bash
npm install
```

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/task_manager
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

## 3. Frontend

Open another terminal in `frontend`:

```bash
npm install
```

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

## Features

- Register and login
- JWT-based authentication
- Protected task APIs
- Create tasks
- Update tasks
- Delete tasks
- Task status:
  - Not Started
  - In Progress
  - Completed
- Search and status filtering
- Due dates
- Real-time task updates with Socket.IO
- Each user only sees their own tasks
- Responsive desktop/mobile layout

## API

### Authentication

`POST /api/auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

`POST /api/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

`GET /api/auth/me`

Requires:

```text
Authorization: Bearer <token>
```

### Tasks

All task endpoints require the JWT Authorization header.

`GET /api/tasks`

`POST /api/tasks`

```json
{
  "title": "Build dashboard",
  "description": "Create the main dashboard UI",
  "status": "In Progress",
  "priority": "High",
  "dueDate": "2026-09-01"
}
```

`PUT /api/tasks/:id`

`DELETE /api/tasks/:id`

## Real-time behavior

When a user creates, updates, or deletes one of their tasks, the backend emits a Socket.IO event to that user's private room. The dashboard listens for those events and refreshes the task list automatically.

## Production notes

For production deployment:

1. Use MongoDB Atlas or another managed MongoDB service.
2. Set a strong random `JWT_SECRET`.
3. Set `CLIENT_URL` to the deployed frontend origin.
4. Build the frontend with `npm run build`.
5. Use HTTPS.
6. Consider adding rate limiting, email verification, password reset, refresh tokens, audit logs, and server-side validation with a schema library.
