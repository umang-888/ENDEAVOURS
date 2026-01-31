import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            return NextResponse.json({ error: "MONGODB_URI is undefined" }, { status: 500 });
        }

        const start = Date.now();
        await connectDB();
        const duration = Date.now() - start;

        const state = mongoose.connection.readyState;
        const stateMap = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
        };

        return NextResponse.json({
            status: "success",
            message: "Database connected successfully",
            duration: `${duration}ms`,
            readyState: stateMap[state as keyof typeof stateMap] || state,
            uriHidden: uri.replace(/:([^@]+)@/, ":****@"), // Hide password
        });
    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        }, { status: 500 });
    }
}
