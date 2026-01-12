import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "completed";

export interface ITask extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    projectId: Types.ObjectId;
    assignedTo?: Types.ObjectId;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: Date;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            minlength: [2, "Task title must be at least 2 characters"],
            maxlength: [200, "Task title must be less than 200 characters"],
        },
        description: {
            type: String,
            default: "",
            maxlength: [2000, "Description must be less than 2000 characters"],
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project ID is required"],
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "completed"],
            default: "todo",
        },
        dueDate: {
            type: Date,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Creator is required"],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ createdBy: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);

export default Task;
