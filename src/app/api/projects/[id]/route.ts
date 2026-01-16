import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, Task, Activity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/projects/:id - Get project details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id)
            .populate("owner", "name email")
            .populate("members", "name email");

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Check access
        const isOwner = project.owner._id.toString() === session.userId;
        const isMember = project.members.some(
            (m: { _id: { toString: () => string } }) => m._id.toString() === session.userId
        );

        if (!isOwner && !isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get task counts
        const taskCounts = await Task.aggregate([
            { $match: { projectId: project._id } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const counts = {
            todo: 0,
            "in-progress": 0,
            completed: 0,
        };

        taskCounts.forEach((tc) => {
            counts[tc._id as keyof typeof counts] = tc.count;
        });

        return NextResponse.json({
            project,
            taskCounts: counts,
            isOwner,
        });
    } catch (error) {
        console.error("Get project error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// PUT /api/projects/:id - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const result = updateProjectSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner can update
        if (project.owner.toString() !== session.userId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: result.data },
            { new: true }
        )
            .populate("owner", "name email")
            .populate("members", "name email");

        // Log activity
        await Activity.create({
            userId: session.userId,
            action: "project_updated",
            projectId: project._id,
            details: `Updated project "${updatedProject!.name}"`,
        });

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Update project error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// DELETE /api/projects/:id - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner can delete
        if (project.owner.toString() !== session.userId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const projectName = project.name;

        // Delete all tasks in the project
        await Task.deleteMany({ projectId: id });

        // Delete the project
        await Project.findByIdAndDelete(id);

        // Log activity
        await Activity.create({
            userId: session.userId,
            action: "project_deleted",
            details: `Deleted project "${projectName}"`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete project error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
