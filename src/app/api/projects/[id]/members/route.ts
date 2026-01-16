import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, User } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/projects/:id/members - Add member to project
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner can add members
        if (project.owner.toString() !== session.userId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Find user by email
        const userToAdd = await User.findOne({ email });
        if (!userToAdd) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already a member
        if (project.members.includes(userToAdd._id)) {
            return NextResponse.json(
                { error: "User is already a member" },
                { status: 400 }
            );
        }

        // Can't add owner as member
        if (project.owner.toString() === userToAdd._id.toString()) {
            return NextResponse.json(
                { error: "Owner is already part of the project" },
                { status: 400 }
            );
        }

        project.members.push(userToAdd._id);
        await project.save();

        const updatedProject = await Project.findById(id)
            .populate("owner", "name email")
            .populate("members", "name email");

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Add member error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}

// DELETE /api/projects/:id/members - Remove member from project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { userId: memberIdToRemove } = await request.json();

        if (!memberIdToRemove) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner can remove members
        if (project.owner.toString() !== session.userId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        project.members = project.members.filter(
            (m) => m.toString() !== memberIdToRemove
        );
        await project.save();

        const updatedProject = await Project.findById(id)
            .populate("owner", "name email")
            .populate("members", "name email");

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error("Remove member error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
