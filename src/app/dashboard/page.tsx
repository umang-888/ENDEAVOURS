"use client";

import useSWR from "swr";
import {
    FolderKanban,
    CheckSquare,
    Clock,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

interface Stats {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    tasksByPriority: { low: number; medium: number; high: number };
    upcomingDeadlines: number;
    overdueTasks: number;
}

interface Activity {
    _id: string;
    action: string;
    details: string;
    createdAt: string;
    userId: { name: string };
    projectId?: { name: string };
}

const COLORS = ["#8b5cf6", "#3b82f6", "#22c55e"];

export default function DashboardPage() {
    const { data: statsData, isLoading: statsLoading } = useSWR<Stats>("/api/stats");
    const { data: activityData, isLoading: activityLoading } = useSWR<{ activities: Activity[] }>(
        "/api/activity?limit=5"
    );

    const stats = statsData;
    const activities = activityData?.activities || [];

    const statusData = stats
        ? [
            { name: "To Do", value: stats.todoTasks, color: "#8b5cf6" },
            { name: "In Progress", value: stats.inProgressTasks, color: "#3b82f6" },
            { name: "Completed", value: stats.completedTasks, color: "#22c55e" },
        ]
        : [];

    const priorityData = stats
        ? [
            { name: "Low", value: stats.tasksByPriority.low },
            { name: "Medium", value: stats.tasksByPriority.medium },
            { name: "High", value: stats.tasksByPriority.high },
        ]
        : [];

    const completionRate = stats && stats.totalTasks > 0
        ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                        )}
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats?.totalTasks || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.completedTasks || 0} completed
                                </p>
                            </>
                        )}
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{stats?.upcomingDeadlines || 0}</div>
                                <p className="text-xs text-muted-foreground">In the next 7 days</p>
                            </>
                        )}
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-yellow-500/10 to-transparent rounded-tl-full" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-20" />
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-red-600">{stats?.overdueTasks || 0}</div>
                                <p className="text-xs text-muted-foreground">Need attention</p>
                            </>
                        )}
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-red-500/10 to-transparent rounded-tl-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Tasks by Status */}
                <Card className="col-span-full lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Tasks by Priority</CardTitle>
                        <CardDescription>Distribution of tasks across priority levels</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {statsLoading ? (
                            <Skeleton className="h-[200px] w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={priorityData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Status Pie Chart */}
                <Card className="col-span-full lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Task Status</CardTitle>
                        <CardDescription>Current status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-[200px] w-full" />
                        ) : stats?.totalTasks === 0 ? (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                No tasks yet
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2">
                                    {statusData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm">{item.name}</span>
                                            <span className="text-sm font-medium ml-auto">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Completion Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Completion Rate</CardTitle>
                            <CardDescription>Overall task completion</CardDescription>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-16 w-full" />
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-bold">{completionRate}%</span>
                                    <span className="text-sm text-muted-foreground pb-1">completed</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${completionRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.completedTasks || 0} of {stats?.totalTasks || 0} tasks completed
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates across your projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activityLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No recent activity
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.slice(0, 5).map((activity) => (
                                    <div key={activity._id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm">{activity.details}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(activity.createdAt).toLocaleDateString()}
                                                </span>
                                                {activity.projectId && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {activity.projectId.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
