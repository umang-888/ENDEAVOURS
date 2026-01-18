import { NextResponse } from "next/server";
import { connectDB, Project, Task } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/stats - Get dashboard statistics
export async function GET() {
    try {
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get user's projects
        const userProjects = await Project.find({
            $or: [{ owner: session.userId }, { members: session.userId }],
        });

        const projectIds = userProjects.map((p) => p._id);
        const totalProjects = userProjects.length;

        // Get task stats
        const taskStats = await Task.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                    },
                    inProgress: {
                        $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] },
                    },
                    todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
                },
            },
        ]);

        const stats = taskStats[0] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            todo: 0,
        };

        // Get tasks by priority
        const tasksByPriority = await Task.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);

        const priorityData = { low: 0, medium: 0, high: 0 };
        tasksByPriority.forEach((item) => {
            priorityData[item._id as keyof typeof priorityData] = item.count;
        });

        // Get upcoming deadlines (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingDeadlines = await Task.countDocuments({
            projectId: { $in: projectIds },
            dueDate: { $gte: now, $lte: nextWeek },
            status: { $ne: "completed" },
        });

        // Get overdue tasks
        const overdueTasks = await Task.countDocuments({
            projectId: { $in: projectIds },
            dueDate: { $lt: now },
            status: { $ne: "completed" },
        });

        return NextResponse.json({
            totalProjects,
            totalTasks: stats.total,
            completedTasks: stats.completed,
            inProgressTasks: stats.inProgress,
            todoTasks: stats.todo,
            tasksByPriority: priorityData,
            upcomingDeadlines,
            overdueTasks,
        });
    } catch (error) {
        console.error("Get stats error:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
