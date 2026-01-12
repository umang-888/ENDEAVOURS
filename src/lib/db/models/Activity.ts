import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ActivityAction =
    | "project_created"
    | "project_updated"
    | "project_deleted"
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "task_status_changed"
    | "task_assigned"
    | "member_added"
    | "member_removed";

export interface IActivity extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    action: ActivityAction;
    projectId?: Types.ObjectId;
    taskId?: Types.ObjectId;
    details: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        action: {
            type: String,
            required: [true, "Action is required"],
            enum: [
                "project_created",
                "project_updated",
                "project_deleted",
                "task_created",
                "task_updated",
                "task_deleted",
                "task_status_changed",
                "task_assigned",
                "member_added",
                "member_removed",
            ],
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
        },
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
        },
        details: {
            type: String,
            required: [true, "Details are required"],
            maxlength: [500, "Details must be less than 500 characters"],
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Index for faster queries
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ projectId: 1, createdAt: -1 });

const Activity: Model<IActivity> =
    mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
