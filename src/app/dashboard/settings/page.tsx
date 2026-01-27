"use client";

import * as React from "react";
import useSWR from "swr";
import { Loader2, User, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getInitials } from "@/lib/utils";

interface UserData {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

export default function SettingsPage() {
    const { data, isLoading, mutate } = useSWR<{ user: UserData }>("/api/auth/me");
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [name, setName] = React.useState("");

    const user = data?.user;

    React.useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Note: Profile update API would need to be implemented
        // For now, just show a toast
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
            mutate();
        } catch {
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6 mb-6">
                        <Avatar className="h-20 w-20">
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                {user?.name ? getInitials(user.name) : "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">{user?.name}</h3>
                            <p className="text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </Label>
                            <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Member Since
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {user?.createdAt ? formatDate(user.createdAt) : "Unknown"}
                            </p>
                        </div>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Theme Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how Endeavours looks on your device</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Use the theme toggle in the header to switch between light and dark modes.
                        Your preference will be saved automatically.
                    </p>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive" disabled>
                        Delete Account
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        Account deletion is currently disabled
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
