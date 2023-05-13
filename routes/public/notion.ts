import { event, query } from '#src/utils';

export const notion = async () => {
    let response = '';

    const dynamodbPosts = [
        ...(await query(`SELECT * from htic WHERE "pk"='post' ORDER BY "sk" ASC`)),
        ...(await query(`SELECT * from htic WHERE "pk"='app' ORDER BY "sk" ASC`)),
    ];

    const postsNotionId = '3dfb0d0202894333854a64cc463b622f';
    const appsNotionId = 'fd4047e4863241a79c18f23766054531';

    const notionPosts = [
        ...(await (await fetch(`https://api.notion.com/v1/blocks/${appsNotionId}/children`, { headers: { 'Notion-Version': '2022-06-28', Authorization: `Bearer ${process.env.notion}` } })).json()).results,
        ...(await (await fetch(`https://api.notion.com/v1/blocks/${postsNotionId}/children`, { headers: { 'Notion-Version': '2022-06-28', Authorization: `Bearer ${process.env.notion}` } })).json()).results,
    ].map(obj => { return { id: obj.id.replace(/-/g, ''), last_edited_time: obj.last_edited_time, title: obj.child_page.title, type: obj.parent.page_id.replace(/-/g, '') === postsNotionId ? 'post' : 'app' } });

    for (const notionPost of notionPosts) {
        const dynamodbPost = dynamodbPosts.find(({ notion_id }) => notion_id === notionPost.id);
        if (!dynamodbPost && notionPost.type === 'post') {
            //we must replicate the notion page as a row in dynamodb
            const html = await convertNotionBlocksToHtml(notionPost.id);
            await query(`INSERT INTO htic VALUE {
                    'pk':'${notionPost.type}', 
                    'sk':'${notionPost.type==='post'?new Date().toISOString() : notionPosts.filter(obj=>obj.type==='app').length}', 
                    'id':'${notionPost.title.toLowerCase().replace(/ /g,'-')}', 
                    'notion_id':'${notionPost.id.replace(/-/g,'')}', 
                    'title':'${notionPost.title}', 
                    'comment_count':0, 
                    'content':?
                }`, [{ S: html }]);
            response += `added '${notionPost.title}', `;
        }
        else if (notionPost.last_edited_time !== dynamodbPost.last_edited_time || event.queryStringParameters?.force) {
            //the post has been edited (or we're forcing a global update), so we must update the title and content
            const html = await convertNotionBlocksToHtml(dynamodbPost.notion_id);
            await query(`UPDATE htic SET 
                    "title"='${notionPost.title}', 
                    "content"=?, 
                    "last_edited_time"='${notionPost.last_edited_time}' 
                WHERE "pk"='${dynamodbPost.type}' AND "sk"='${dynamodbPost.sk}' AND "id"='${dynamodbPost.id}'`, [{ S: html }]);
            response += `updated '${notionPost.title}', `;
        }
    }

    //remove deleted notion posts from dynamodb
    for (const dynamodbPost of dynamodbPosts.filter(({ notion_id }) => !notionPosts.map(({ id }) => id).includes(notion_id))) {
        await query(`DELETE from htic WHERE "pk"='${dynamodbPost.type}' AND "sk"='${dynamodbPost.sk}'`);
        response += `deleted '${dynamodbPost.id}', `;
    }

    const lambdaDuration = new Date(new Date() - event.lambdaStart);
    const message = `Successfully ran in ${(lambdaDuration.getTime() / 1000).toFixed(2)} seconds: ${response.length ? response: 'no updates detected'}.`;
    console.log(message);
    return message;
};

export const convertNotionBlocksToHtml = async (id) => {
    const convertType = (type) => {
        if (type === 'paragraph') {
            return ['<p>', '</p>'];
        }
        else if (type.startsWith('heading')) {
            const headingLevel = type.split('_')[1];
            return [`<h${headingLevel}>`, `</h${headingLevel}>`];
        }
        else if (type === 'bulleted_list_item') {
            return ['<li>', '</li>'];
        }
        else {
            return ['', ''];
        }
    };
    const convertAnnotations = (annotations, href) => {
        if (href) {
            return [`<a target="_blank" rel="noreferrer" href="${href}">`, '</a>'];
        }
        else if (annotations.bold) {
            return ['<b>', '</b>'];
        }
        else if (annotations.italic) {
            return ['<i>', '</i>'];
        }
        else if (annotations.code) {
            return ['<code>', '</code>'];
        }
        else {
            return ['', ''];
        }
    };
    let response = '';
    const blocks = (await (await fetch(`https://api.notion.com/v1/blocks/${id}/children`, { headers: { 'Notion-Version': '2022-06-28', Authorization: `Bearer ${process.env.notion}` } })).json()).results;
    for (const block of blocks) {
        if (block.type === 'image') {
            const title = block.image.caption.length ? block.image.caption[0].plain_text : '';
            response += `<img class="thumbnail" src="${block.image.external.url}" title="${title}" />`;
        }
        else {
            const [startTag, endTag] = convertType(block.type);
            response += startTag;
            for (const element of block[block.type].rich_text) {
                if (element.type === 'text') {
                    const [startTag, endTag] = convertAnnotations(element.annotations, element.href);
                    response += `${startTag}${element.text.content}${endTag}`;
                }
            }
            response += endTag;
        }
    }
    return response;
};
