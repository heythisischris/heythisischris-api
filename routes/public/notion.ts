import { notionSync } from "../scheduled"

export const notion = async () => {
    await notionSync();
    return `Successfully synced`;
}