import { NextRequest, NextResponse } from "next/server";
import { getCurrentTime } from "@coldflow/db";

export async function GET(request: NextRequest) {
    try {
        const currentTime = await getCurrentTime();
        return NextResponse.json({ message: "OK", currentTime: currentTime });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error", error: error }, { status: 500 });
    }
}