import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import api from "../api";
import Navbar from "../components/Navbar";

const statuses = ["Not Started", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];

const emptyForm = {
  title: "",
  description: "",
  status: "Not Started",
  priority: "Medium",
  dueDate: ""
};

function formatDate(date) {
  if (!date) return "No due date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(date));
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadTasks() {
    try {
      const response = await api.get("/tasks");
      setTasks(response.data.tasks);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: {
          token: localStorage.getItem("taskflow_token")
        }
      }
    );

    const refresh = () => {
      loadTasks();
      setToast("Tasks updated in real time.");
      window.setTimeout(() => setToast(""), 2200);
    };

    socket.on("task:created", refresh);
    socket.on("task:updated", refresh);
    socket.on("task:deleted", refresh);

    return () => socket.disconnect();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter = filter === "All" || task.status === filter;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      notStarted: tasks.filter((task) => task.status === "Not Started").length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      completed: tasks.filter((task) => task.status === "Completed").length
    }),
    [tasks]
  );

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  function startEdit(task) {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, form);
        setToast("Task updated.");
      } else {
        await api.post("/tasks", form);
        setToast("Task created.");
      }

      await loadTasks();
      cancelEdit();
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id) {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    try {
      await api.delete(`/tasks/${id}`);
      await loadTasks();
      setToast("Task deleted.");
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete task.");
    }
  }

  async function changeStatus(task, status) {
    try {
      await api.put(`/tasks/${task._id}`, { status });
      await loadTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update status.");
    }
  }

  return (
    <>
      <Navbar />

      <main className="dashboard">
        <section className="dashboard-header">
          <div>
            <h1>My tasks</h1>
            <p>Create, update and track everything in one place.</p>
          </div>
          <div className="live-indicator">
            <span className="live-dot" />
            Live updates
          </div>
        </section>

        {toast && <div className="toast">{toast}</div>}
        {error && <div className="alert error">{error}</div>}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card">
            <span>Not Started</span>
            <strong>{stats.notStarted}</strong>
          </div>
          <div className="stat-card">
            <span>In Progress</span>
            <strong>{stats.inProgress}</strong>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{stats.completed}</strong>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel task-form-panel">
            <div className="panel-heading">
              <div>
                <h2>{editingId ? "Edit task" : "Create a task"}</h2>
                <p>
                  {editingId
                    ? "Update the details and status."
                    : "Add a new task to your workspace."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="form">
              <label>
                Title
                <input
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  placeholder="e.g. Finish project report"
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  placeholder="Add more details..."
                  rows="5"
                />
              </label>

              <div className="form-row">
                <label>
                  Status
                  <select name="status" value={form.status} onChange={updateField}>
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={updateField}
                  >
                    {priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Due date
                <input
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={updateField}
                />
              </label>

              <div className="button-row">
                <button className="button button-primary" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update task"
                      : "Create task"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="panel">
            <div className="panel-heading tasks-heading">
              <div>
                <h2>Task list</h2>
                <p>{filteredTasks.length} task(s) shown</p>
              </div>
            </div>

            <div className="toolbar">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
              />

              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option>All</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="empty-state">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No tasks found</h3>
                <p>Create a task or change your filters.</p>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <article className="task-card" key={task._id}>
                    <div className="task-main">
                      <div className="task-title-row">
                        <h3>{task.title}</h3>
                        <span className={`priority priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && <p>{task.description}</p>}

                      <div className="task-meta">
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                    </div>

                    <div className="task-actions">
                      <select
                        value={task.status}
                        onChange={(event) =>
                          changeStatus(task, event.target.value)
                        }
                        aria-label={`Status for ${task.title}`}
                      >
                        {statuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>

                      <button
                        className="button button-small button-secondary"
                        onClick={() => startEdit(task)}
                      >
                        Edit
                      </button>

                      <button
                        className="button button-small button-danger"
                        onClick={() => deleteTask(task._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
