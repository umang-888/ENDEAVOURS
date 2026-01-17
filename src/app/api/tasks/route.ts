import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, Task, Activity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validations";

// GET /api/tasks - List tasks with filters
export async function GET(request: NextRequest) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const assignedTo = searchParams.get("assignedTo");

        await connectDB();

        // Get user's projects
        const userProjects = await Project.find({
            $or: [{ owner: session.userId }, { members: session.userId }],
        }).select("_id");

        const projectIds = userProjects.map((p) => p._id);

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: Record<string, any> = {
            projectId: projectId ? projectId : { $in: projectIds },
        };

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;

        const tasks = await Task.find(query)
            .populate("projectId", "name")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json({ tasks });
    } catch (error) {
        console.error("Get tasks error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const result = createTaskSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        // Check project access
        const project = await Project.findById(result.data.projectId);
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

        const taskData = {
            title: result.data.title,
            description: result.data.description || "",
            projectId: result.data.projectId,
            priority: result.data.priority,
            status: result.data.status,
            createdBy: session.userId,
            assignedTo: result.data.assignedTo || undefined,
            dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
        };

        const task = await Task.create(taskData);

        // Log activity
        await Activity.create({
            userId: session.userId,
            action: "task_created",
            projectId: project._id,
            taskId: task._id,
            details: `Created task "${task.title}"`,
        });

        const populatedTask = await Task.findById(task._id)
            .populate("projectId", "name")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        return NextResponse.json({ task: populatedTask }, { status: 201 });
    } catch (error) {
        console.error("Create task error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
