import { event, query } from '#src/utils';

export const app = async () => {
    const app = (await query(`SELECT * from htic WHERE "pk"='app' AND "id"='${event.queryStringParameters.id}' ORDER BY "sk" DESC`))[0];
    return app;
};
