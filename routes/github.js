import { query } from '../utils/query.js';

export const github = async ({ event }) => {
    const commits = (await query(`SELECT "content" from htic WHERE "pk"='github' AND "sk"='0'`))[0].content;
    return { statusCode: 200, body: commits, headers: { 'Access-Control-Allow-Origin': '*' } };
};
