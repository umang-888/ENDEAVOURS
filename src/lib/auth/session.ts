import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";

const AUTH_COOKIE_NAME = "auth_token";

export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
    });
}

export async function removeAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value || null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = await getAuthToken();
    if (!token) return null;
    return verifyToken(token);
}
