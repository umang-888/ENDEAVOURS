import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, Task, Activity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateTaskSchema } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/tasks/:id - Get task details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const task = await Task.findById(id)
            .populate("projectId", "name owner members")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check access via project
        const project = await Project.findById(task.projectId);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.owner.toString() === session.userId;
        const isMember = project.members.some(
            (m) => m.toString() === session.userId
        );

        if (!isOwner && !isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error("Get task error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// PUT /api/tasks/:id - Update task
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const result = updateTaskSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const task = await Task.findById(id);
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check access via project
        const project = await Project.findById(task.projectId);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const isOwner = project.owner.toString() === session.userId;
        const isMember = project.members.some(
            (m) => m.toString() === session.userId
        );

        if (!isOwner && !isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const oldStatus = task.status;
        const updateData = { ...result.data };

        if (updateData.dueDate) {
            updateData.dueDate = new Date(updateData.dueDate).toISOString();
        }

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        )
            .populate("projectId", "name")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        // Log activity based on change type
        if (result.data.status && result.data.status !== oldStatus) {
            await Activity.create({
                userId: session.userId,
                action: "task_status_changed",
                projectId: project._id,
                taskId: task._id,
                details: `Changed task "${task.title}" status from ${oldStatus} to ${result.data.status}`,
                metadata: { oldStatus, newStatus: result.data.status },
            });
        } else if (result.data.assignedTo) {
            await Activity.create({
                userId: session.userId,
                action: "task_assigned",
                projectId: project._id,
                taskId: task._id,
                details: `Assigned task "${task.title}"`,
            });
        } else {
            await Activity.create({
                userId: session.userId,
                action: "task_updated",
                projectId: project._id,
                taskId: task._id,
                details: `Updated task "${task.title}"`,
            });
        }

        return NextResponse.json({ task: updatedTask });
    } catch (error) {
        console.error("Update task error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// DELETE /api/tasks/:id - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const task = await Task.findById(id);
        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check access via project
        const project = await Project.findById(task.projectId);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner or task creator can delete
        const isOwner = project.owner.toString() === session.userId;
        const isCreator = task.createdBy.toString() === session.userId;

        if (!isOwner && !isCreator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const taskTitle = task.title;
        await Task.findByIdAndDelete(id);

        // Log activity
        await Activity.create({
            userId: session.userId,
            action: "task_deleted",
            projectId: project._id,
            details: `Deleted task "${taskTitle}"`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete task error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
