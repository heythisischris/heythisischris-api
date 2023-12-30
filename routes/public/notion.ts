import { event } from '#src/utils';
import { notionSync } from "../scheduled"

export const notion = async () => {
    const startDate = new Date();
    await notionSync({ tables: event.queryStringParameters.tables.split(',') });
    const endDate = new Date();
    const duration = endDate.getTime() - startDate.getTime();
    return `Successfully synced in ${duration}ms`;
}