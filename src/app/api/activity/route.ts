import { NextRequest, NextResponse } from "next/server";
import { connectDB, Project, Activity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/activity - Get activity logs
export async function GET(request: NextRequest) {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        const limit = parseInt(searchParams.get("limit") || "20");

        await connectDB();

        // Get user's projects
        const userProjects = await Project.find({
            $or: [{ owner: session.userId }, { members: session.userId }],
        }).select("_id");

        const projectIds = userProjects.map((p) => p._id);

        // Build query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: Record<string, any> = projectId
            ? { projectId }
            : {
                $or: [
                    { projectId: { $in: projectIds } },
                    { userId: session.userId },
                ],
            };

        const activities = await Activity.find(query)
            .populate("userId", "name email")
            .populate("projectId", "name")
            .populate("taskId", "title")
            .sort({ createdAt: -1 })
            .limit(limit);

        return NextResponse.json({ activities });
    } catch (error) {
        console.error("Get activity error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
