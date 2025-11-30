import { db } from "./client";
import { sql } from "drizzle-orm";
export const getCurrentTime = async () => {
    const rawSelectResult = await db.execute(sql`SELECT NOW() as current_time`);
    return rawSelectResult.rows[0].current_time;
}