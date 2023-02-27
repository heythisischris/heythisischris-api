import { query } from '../utils/query.js';

export const app = async ({ event }) => {
    const app = (await query(`SELECT * from htic WHERE "pk"='app' AND "id"='${event.queryStringParameters.id}' ORDER BY "sk" DESC`))[0];
    return { statusCode: 200, body: JSON.stringify(app), headers: { 'Access-Control-Allow-Origin': '*' } };
};
