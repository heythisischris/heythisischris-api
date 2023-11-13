import { client, notion } from "#src/utils";

const typesDict = {
    apps: {
        paragraph: [`<div>`, `</div>`],
        heading_3: [`<div class='font-bold text-xl'>`, `</div>`],
        bulleted_list_item: [`<li style='margin-left:30px'>`, `</li>`],
    },
    posts: {
        paragraph: [`<p>`, `</p>`],
        heading_3: [`<div class='font-bold text-xl'>`, `</div>`],
        bulleted_list_item: [`<li style='margin-left:30px'>`, `</li>`],
    },
};
const convertAnnotations = (annotations, href) => {
    if (href) {
        return [`<a target="_blank" rel="noreferrer" href="${href}">`, `</a>`];
    }
    else if (annotations.bold) {
        return [`<b>`, `</b>`];
    }
    else if (annotations.italic) {
        return [`<i>`, `</i>`];
    }
    else if (annotations.code) {
        return [`<code>`, `</code>`];
    }
    else {
        return ['', ''];
    }
};

export const notionSync = async () => {
    await client.connect();
    for (const { databaseId, table } of [
        { databaseId: 'cd84b4ed1d59460a8ee9070a4156cd3a', table: 'apps' },
        { databaseId: '10378f9e5cfb4174ba811c9a52574741', table: 'posts' },
    ]) {
        const notionIds = (await notion.databases.query({ database_id: databaseId }))?.results?.map(({ id }) => id);
        for (const notionId of notionIds) {
            const blocks = (await notion.blocks.children.list({ block_id: notionId }))?.results;
            let response = '';
            for (const block of blocks) {
                if (block.type === 'image') {
                    const title = block.image.caption.length ? block.image.caption[0].plain_text : '';
                    response += `<img class="thumbnail" src="${block.image.external.url}" title="${title}" />`;
                }
                else {
                    const [startTag, endTag] = typesDict[table][block.type];
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
            await client.query(`UPDATE "${table}" SET "content"=$1 WHERE "notion_id"=$2`, [response, notionId]);
        }
    }
    await client.clean();
    return;
};