import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatRelativeDate(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffInDays = Math.floor((then.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Tomorrow";
    if (diffInDays === -1) return "Yesterday";
    if (diffInDays > 0 && diffInDays <= 7) return `In ${diffInDays} days`;
    if (diffInDays < 0 && diffInDays >= -7) return `${Math.abs(diffInDays)} days ago`;

    return formatDate(date);
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}
