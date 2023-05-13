import { query } from '#src/utils';

export const posts = async () => {
    const posts = await query(`SELECT * from htic WHERE "pk"='post' ORDER BY "sk" DESC`);
    return posts;
};
