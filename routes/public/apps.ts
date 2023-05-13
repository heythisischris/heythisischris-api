import { event, query } from '#src/utils';

export const apps = async () => {
    if (event?.queryStringParameters?.id) {
        const [app] = await query(`SELECT * from htic WHERE "pk"='app' AND "id"='${event.queryStringParameters.id}' ORDER BY "sk" DESC`);
        return app;
    }
    else {
        const apps = await query(`SELECT * from htic WHERE "pk"='app' ORDER BY "sk" ASC`);
        return apps;
    }
};
