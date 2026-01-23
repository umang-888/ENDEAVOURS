"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-red-600">Something went wrong!</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        An unexpected error occurred. Please try again.
                    </p>
                </div>
                <Button onClick={reset}>Try Again</Button>
            </div>
        </div>
    );
}
