import { query } from '#src/utils';

export const apps = async () => {
    const apps = await query(`SELECT * from htic WHERE "pk"='app' ORDER BY "sk" ASC`);
    return apps;
};
