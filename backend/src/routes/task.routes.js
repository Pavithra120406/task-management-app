import express from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const allowedStatuses = ["Not Started", "In Progress", "Completed"];
const allowedPriorities = ["Low", "Medium", "High"];

function emitTaskEvent(req, event, task) {
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${req.user._id}`).emit(event, task);
  }
}

router.use(protect);

router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch tasks." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description = "", status = "Not Started", priority = "Medium", dueDate } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid task priority." });
    }

    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null
    });

    emitTaskEvent(req, "task:created", task);
    res.status(201).json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to create task." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }

    const { title, description, status, priority, dueDate } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: "Task title cannot be empty." });
    }

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    if (priority !== undefined && !allowedPriorities.includes(priority)) {
      return res.status(400).json({ message: "Invalid task priority." });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate || null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    emitTaskEvent(req, "task:updated", task);
    res.json({ task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to update task." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID." });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    emitTaskEvent(req, "task:deleted", { id: task._id });
    res.json({ message: "Task deleted." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to delete task." });
  }
});

export default router;
