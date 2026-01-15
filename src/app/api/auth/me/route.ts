import { NextResponse } from "next/server";
import { connectDB, User } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getCurrentUser();

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const user = await User.findById(session.userId).select("-password");

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Get user error:", error);
        return NextResponse.json(
            { error: "An error occurred" },
            { status: 500 }
        );
    }
}
