import { event, query } from '#src/utils';

export const posts = async () => {
    if (event?.queryStringParameters?.id) {
        const [post] = await query(`SELECT * from htic WHERE "pk"='post' AND id='${event.queryStringParameters.id}'`);
        return post;
    }
    else {
        const posts = await query(`SELECT * from htic WHERE "pk"='post' ORDER BY "sk" DESC`);
        return posts;
    }
};
