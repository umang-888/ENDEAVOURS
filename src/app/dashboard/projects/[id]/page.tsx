"use client";

import * as React from "react";
import { use } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Loader2,
    Calendar,
    User,
    Users,
    LayoutGrid,
    List,
    UserPlus,
    X,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatRelativeDate } from "@/lib/utils";

interface ProjectDetail {
    project: {
        _id: string;
        name: string;
        description: string;
        owner: { _id: string; name: string; email: string };
        members: { _id: string; name: string; email: string }[];
        createdAt: string;
    };
    taskCounts: { todo: number; "in-progress": number; completed: number };
    isOwner: boolean;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: "todo" | "in-progress" | "completed";
    priority: "low" | "medium" | "high";
    dueDate?: string;
    assignedTo?: { _id: string; name: string; email: string };
    createdBy: { _id: string; name: string };
    createdAt: string;
}

const priorityColors = {
    low: "success",
    medium: "warning",
    high: "destructive",
} as const;

const statusLabels = {
    todo: "To Do",
    "in-progress": "In Progress",
    completed: "Completed",
};

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { toast } = useToast();

    const { data: projectData, isLoading: projectLoading } = useSWR<ProjectDetail>(
        `/api/projects/${id}`
    );
    const { data: tasksData, isLoading: tasksLoading } = useSWR<{ tasks: Task[] }>(
        `/api/tasks?projectId=${id}`
    );

    const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
    const [isEditTaskOpen, setIsEditTaskOpen] = React.useState(false);
    const [isDeleteTaskOpen, setIsDeleteTaskOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<"list" | "kanban">("list");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState("");

    const [taskForm, setTaskForm] = React.useState({
        title: "",
        description: "",
        priority: "medium" as const,
        status: "todo" as const,
        dueDate: "",
        assignedTo: "",
    });

    const project = projectData?.project;
    const taskCounts = projectData?.taskCounts;
    const isOwner = projectData?.isOwner || false;
    const tasks = tasksData?.tasks || [];

    const filteredTasks = tasks.filter((task) => {
        if (statusFilter !== "all" && task.status !== statusFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
        return true;
    });

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...taskForm,
                    projectId: id,
                    dueDate: taskForm.dueDate || undefined,
                    assignedTo: taskForm.assignedTo || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast({ title: "Task created successfully" });
            setIsTaskDialogOpen(false);
            setTaskForm({
                title: "",
                description: "",
                priority: "medium",
                status: "todo",
                dueDate: "",
                assignedTo: "",
            });
            mutate(`/api/tasks?projectId=${id}`);
            mutate(`/api/projects/${id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/tasks/${selectedTask._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...taskForm,
                    dueDate: taskForm.dueDate || undefined,
                    assignedTo: taskForm.assignedTo || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast({ title: "Task updated successfully" });
            setIsEditTaskOpen(false);
            setSelectedTask(null);
            mutate(`/api/tasks?projectId=${id}`);
            mutate(`/api/projects/${id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/tasks/${selectedTask._id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast({ title: "Task deleted successfully" });
            setIsDeleteTaskOpen(false);
            setSelectedTask(null);
            mutate(`/api/tasks?projectId=${id}`);
            mutate(`/api/projects/${id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete task",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            mutate(`/api/tasks?projectId=${id}`);
            mutate(`/api/projects/${id}`);
        } catch {
            toast({
                title: "Error",
                description: "Failed to update task status",
                variant: "destructive",
            });
        }
    };

    const openEditTaskDialog = (task: Task) => {
        setSelectedTask(task);
        setTaskForm({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
            assignedTo: task.assignedTo?._id || "",
        });
        setIsEditTaskOpen(true);
    };

    const openDeleteTaskDialog = (task: Task) => {
        setSelectedTask(task);
        setIsDeleteTaskOpen(true);
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/projects/${id}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error);
            }

            toast({ title: "Member invited successfully" });
            setIsInviteDialogOpen(false);
            setInviteEmail("");
            mutate(`/api/projects/${id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to invite member",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            const res = await fetch(`/api/projects/${id}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            toast({ title: "Member removed successfully" });
            mutate(`/api/projects/${id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove member",
                variant: "destructive",
            });
        }
    };

    const allMembers = project
        ? [project.owner, ...project.members]
        : [];

    if (projectLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <h2 className="text-xl font-semibold mb-2">Project not found</h2>
                <Link href="/dashboard/projects">
                    <Button variant="outline">Go back to projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Link href="/dashboard/projects" className="hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Projects
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <p className="text-muted-foreground">{project.description || "No description"}</p>
                </div>
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary text-white border-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <form onSubmit={handleCreateTask}>
                            <DialogHeader>
                                <DialogTitle>Create Task</DialogTitle>
                                <DialogDescription>Add a new task to this project</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="Enter task title"
                                        value={taskForm.title}
                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter task description"
                                        value={taskForm.description}
                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select
                                            value={taskForm.priority}
                                            onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as typeof taskForm.priority })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={taskForm.status}
                                            onValueChange={(v) => setTaskForm({ ...taskForm, status: v as typeof taskForm.status })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todo">To Do</SelectItem>
                                                <SelectItem value="in-progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Assign To</Label>
                                    <Select
                                        value={taskForm.assignedTo}
                                        onValueChange={(v) => setTaskForm({ ...taskForm, assignedTo: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allMembers.map((member) => (
                                                <SelectItem key={member._id} value={member._id}>
                                                    {member.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Create Task
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">To Do</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{taskCounts?.todo || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{taskCounts?.["in-progress"] || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{taskCounts?.completed || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span className="text-2xl font-bold">{allMembers.length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Members Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Team Members
                            </CardTitle>
                            <CardDescription>Manage project team and assign tasks to members</CardDescription>
                        </div>
                        {isOwner && (
                            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gradient-primary text-white border-0">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Invite Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleInviteMember}>
                                        <DialogHeader>
                                            <DialogTitle>Invite Team Member</DialogTitle>
                                            <DialogDescription>
                                                Send an invitation to add a new member to this project.
                                                They must have an account to be added.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="invite-email">Email Address</Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            id="invite-email"
                                                            type="email"
                                                            placeholder="colleague@example.com"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            className="pl-10"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={isSubmitting}>
                                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                Send Invitation
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {allMembers.map((member) => (
                            <div
                                key={member._id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-medium">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{member.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {member._id === project?.owner._id ? (
                                        <Badge variant="secondary">Owner</Badge>
                                    ) : (
                                        <>
                                            <Badge variant="outline">Member</Badge>
                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveMember(member._id)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {allMembers.length === 1 && (
                        <p className="text-center text-muted-foreground text-sm mt-4">
                            You&apos;re the only member. Invite teammates to collaborate!
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Tasks</CardTitle>
                            <CardDescription>Manage tasks in this project</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                                <TabsList>
                                    <TabsTrigger value="list">
                                        <List className="w-4 h-4" />
                                    </TabsTrigger>
                                    <TabsTrigger value="kanban">
                                        <LayoutGrid className="w-4 h-4" />
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {tasksLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20" />
                            ))}
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground mb-4">No tasks yet. Create your first task!</p>
                            <Button onClick={() => setIsTaskDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="space-y-3">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task._id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium truncate">{task.title}</h4>
                                            <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {task.dueDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatRelativeDate(task.dueDate)}
                                                </span>
                                            )}
                                            {task.assignedTo && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {task.assignedTo.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Select
                                        value={task.status}
                                        onValueChange={(v) => handleStatusChange(task._id, v)}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditTaskDialog(task)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => openDeleteTaskDialog(task)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Kanban View */
                        <div className="grid grid-cols-3 gap-4">
                            {(["todo", "in-progress", "completed"] as const).map((status) => (
                                <div key={status} className="space-y-3">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <h3 className="font-medium">{statusLabels[status]}</h3>
                                        <Badge variant="secondary">
                                            {filteredTasks.filter((t) => t.status === status).length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2 min-h-[200px]">
                                        {filteredTasks
                                            .filter((t) => t.status === status)
                                            .map((task) => (
                                                <Card
                                                    key={task._id}
                                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-medium text-sm">{task.title}</h4>
                                                            <Badge variant={priorityColors[task.priority]} className="text-xs">
                                                                {task.priority}
                                                            </Badge>
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            {task.dueDate && (
                                                                <span>{formatRelativeDate(task.dueDate)}</span>
                                                            )}
                                                            {task.assignedTo && (
                                                                <span>{task.assignedTo.name.split(" ")[0]}</span>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Task Dialog */}
            <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleEditTask}>
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                            <DialogDescription>Update task details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input
                                    id="edit-title"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        value={taskForm.priority}
                                        onValueChange={(v) => setTaskForm({ ...taskForm, priority: v as typeof taskForm.priority })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={taskForm.status}
                                        onValueChange={(v) => setTaskForm({ ...taskForm, status: v as typeof taskForm.status })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">To Do</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-dueDate">Due Date</Label>
                                <Input
                                    id="edit-dueDate"
                                    type="date"
                                    value={taskForm.dueDate}
                                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Assign To</Label>
                                <Select
                                    value={taskForm.assignedTo}
                                    onValueChange={(v) => setTaskForm({ ...taskForm, assignedTo: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allMembers.map((member) => (
                                            <SelectItem key={member._id} value={member._id}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditTaskOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Task Dialog */}
            <Dialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{selectedTask?.title}&quot;? This action cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteTaskOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTask} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
