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
