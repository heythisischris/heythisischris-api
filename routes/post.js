import { query } from '../utils/query.js';

export const post = async ({ event }) => {
    const posts = await query(`SELECT * from htic WHERE "pk"='post' AND id='${event.queryStringParameters.id}'`);
    return { statusCode: 200, body: JSON.stringify(posts[0]), headers: { 'Access-Control-Allow-Origin': '*' } };
};
