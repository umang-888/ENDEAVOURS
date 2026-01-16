import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, Activity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations";

// GET /api/projects - List all projects for current user
export async function GET() {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const projects = await Project.find({
            $or: [{ owner: session.userId }, { members: session.userId }],
        })
            .populate("owner", "name email")
            .populate("members", "name email")
            .sort({ updatedAt: -1 });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Get projects error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const result = createProjectSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const project = await Project.create({
            name: result.data.name,
            description: result.data.description || "",
            owner: session.userId,
            members: [],
        });

        // Log activity
        await Activity.create({
            userId: session.userId,
            action: "project_created",
            projectId: project._id,
            details: `Created project "${project.name}"`,
        });

        const populatedProject = await Project.findById(project._id)
            .populate("owner", "name email")
            .populate("members", "name email");

        return NextResponse.json({ project: populatedProject }, { status: 201 });
    } catch (error) {
        console.error("Create project error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
