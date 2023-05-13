import { event, query } from '#src/utils';

export const post = async () => {
    const posts = await query(`SELECT * from htic WHERE "pk"='post' AND id='${event.queryStringParameters.id}'`);
    return posts[0];
};
