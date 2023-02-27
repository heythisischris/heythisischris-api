import { query } from '../utils/query.js';

export const posts = async ({ event }) => {
    const posts = await query(`SELECT * from htic WHERE "pk"='post' ORDER BY "sk" DESC`);
    return { statusCode: 200, body: JSON.stringify(posts), headers: { 'Access-Control-Allow-Origin': '*' } };
};
