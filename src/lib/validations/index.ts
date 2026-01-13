import { z } from "zod";

// Authentication schemas
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(100, "Password must be less than 100 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

// Project schemas
export const createProjectSchema = z.object({
    name: z
        .string()
        .min(2, "Project name must be at least 2 characters")
        .max(100, "Project name must be less than 100 characters"),
    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional()
        .default(""),
});

export const updateProjectSchema = createProjectSchema.partial();

// Task schemas
export const createTaskSchema = z.object({
    title: z
        .string()
        .min(2, "Task title must be at least 2 characters")
        .max(200, "Task title must be less than 200 characters"),
    description: z
        .string()
        .max(2000, "Description must be less than 2000 characters")
        .optional()
        .default(""),
    projectId: z.string().min(1, "Project is required"),
    assignedTo: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    status: z.enum(["todo", "in-progress", "completed"]).default("todo"),
    dueDate: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
