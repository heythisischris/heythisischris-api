import { event, query } from '#src/utils';
import { generateId } from '#src/utils/ksuid';

export const comments = async () => {
    let response = [{}];
    if (event.httpMethod === 'GET') {
        response = await query(`SELECT * from htic WHERE "pk"='post#${event.queryStringParameters.post_id}#comment' ORDER BY "sk" ASC`);
        for (let obj of response) {
            if (obj.ip_address === event.requestContext.http.sourceIp) {
                obj.canDelete = true;
            }
            obj.id = obj.sk.split('#')[1];
        }
    }
    else if (event.httpMethod === 'POST') {
        const id = generateId();
        await query(`INSERT INTO htic VALUE {
                'pk':'post#${event.body.post_id}#comment',
                'sk':'${id}',
                'ip_address':'${event.requestContext.http.sourceIp}',
                'name':'${event.body.name.substr(0, 10)}',
                'content':'${event.body.content.substr(0, 200)}'
            }`);
        const post = (await query(`SELECT * from htic WHERE "pk"='post' AND "id"='${event.body.post_id}'`))[0];
        await query(`UPDATE htic SET "comment_count"=${post.comment_count + 1} WHERE "pk"='post' AND "sk"='${post.sk}'`);
        response = [{ id }];
    }
    else if (event.httpMethod === 'DELETE') {
        await query(`DELETE from htic WHERE "pk"='post#${event.body.post_id}#comment' AND "sk"='${event.body.sk}' AND "ip_address"='${event.requestContext.http.sourceIp}'`);
        const post = (await query(`SELECT * from htic WHERE "pk"='post' AND "id"='${event.body.post_id}'`))[0];
        await query(`UPDATE htic SET "comment_count"=${post.comment_count !== 0 ? post.comment_count - 1 : 0} WHERE "pk"='post' AND "sk"='${post.sk}'`);
    }
    return response;
};
