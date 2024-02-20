import { client, notion, sleep } from "#src/utils";
import { S3 } from "@aws-sdk/client-s3";
import { getFileType } from '#src/utils';
const s3 = new S3();

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

export const notionSync = async ({ tables } = { tables: ['apps', 'posts'] }) => {
    await client.connect();
    const selectedTables = [];
    if (tables.includes('apps')) {
        selectedTables.push({ databaseId: 'cd84b4ed1d59460a8ee9070a4156cd3a', table: 'apps' });
    }
    if (tables.includes('posts')) {
        selectedTables.push({ databaseId: '10378f9e5cfb4174ba811c9a52574741', table: 'posts' });
    }

    const formatBlock = async ({ table, block }) => {
        let response = '';
        if (block.type === 'image') {
            const title = block.image.caption?.[0]?.plain_text ?? '';
            let imageSource = block.image?.external?.url;
            if (block.image?.file?.url) {
                const strippedUrl = block.image.file.url.split('?')?.[0].replace('https://prod-files-secure.s3.us-west-2.amazonaws.com/', '');
                const notionImageKey = strippedUrl.split('/')[1].replaceAll('-', '');
                const notionImageExtension = strippedUrl.split('.')[1];
                const s3Key = `${notionImageKey}.${notionImageExtension}`;
                imageSource = `https://files.heythisischris.com/${s3Key}`;
                try {
                    await s3.headObject({ Bucket: 'heythisischris-files', Key: s3Key });
                }
                catch (err) {
                    // We need to upload the image to our own S3 bucket. Let's do it.
                    const notionImage = await (await (await fetch(block.image?.file?.url)).blob()).arrayBuffer();
                    await s3.putObject({
                        Bucket: 'heythisischris-files',
                        Key: s3Key,
                        ContentType: getFileType(notionImageExtension),
                        Body: notionImage,
                    });
                }
            }
            response += `<a class="hover:opacity-50" target="_blank" href="${imageSource}"><img class="thumbnail" src="${imageSource}" title="${title}" /></a>`;
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
        return response;
    }

    for (const { databaseId, table } of selectedTables) {
        const notionIds = (await notion.databases.query({ database_id: databaseId }))?.results?.map(({ id }) => id);
        await Promise.allSettled(notionIds.map(async (notionId, index) => {
            await sleep(index * 333);
            const blocks = (await notion.blocks.children.list({ block_id: notionId }))?.results;
            let response = '';
            for (const block of blocks) {
                if (block.has_children) {
                    response += `<div class="flex flex-wrap gap-2">`;
                    const innerBlocks = (await notion.blocks.children.list({ block_id: block.id })).results;
                    for (const innerBlock of innerBlocks) {
                        if (innerBlock.has_children) {
                            const inmostBlocks = (await notion.blocks.children.list({ block_id: innerBlock.id })).results;
                            for (const inmostBlock of inmostBlocks) {
                                response += (await formatBlock({ table, block: inmostBlock }));
                            }
                        }
                    }
                    response += `</div>`;
                }
                else {
                    response += (await formatBlock({ table, block }));
                }
            }
            await client.query(`UPDATE "${table}" SET "content"=$1 WHERE "notion_id"=$2`, [response, notionId]);
        }));
    }
    await client.clean();
    return;
};