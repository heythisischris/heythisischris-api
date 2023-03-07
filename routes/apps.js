import { query } from '../utils/query';

export const apps = async ({ event }) => {
    const apps = await query(`SELECT * from htic WHERE "pk"='app' ORDER BY "sk" ASC`);
    return { statusCode: 200, body: JSON.stringify(apps), headers: { 'Access-Control-Allow-Origin': '*' } };
};
