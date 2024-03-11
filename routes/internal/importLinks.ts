import { client, event, openai, preparePrompt } from '#src/utils';
import { stripHtml } from "string-strip-html";

export const importLinks = async () => {
    await client.connect();
    const links = event?.links ?? event?.queryStringParameters?.links?.split(',');
    for (const link of links) {
        const id = link?.split('id=')?.[1];
        const data = await (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)).json();

        /*
        const discussion = stripHtml(await (await fetch(link)).text()).result;
        const articleData = stripHtml(await (await fetch(data?.url)).text()).result;
        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{
                role: "system",
                content: preparePrompt(`Summarize the article and the discussion over this article- don't mention HackerNews, and keep it to one short paragraph.
                \`\`\`
                ${JSON.stringify({ discussion, articleData })}
                \`\`\`
                `)
            }]
        });
        */
        const openaiResponse = null;

        await client.query(`
            INSERT INTO "links" ("created_at", "title", "link", "source_link", "description") VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
        `, [new Date(data?.time * 1000), data?.title, link, data?.url, openaiResponse?.choices?.[0]?.message?.content]);
    }
    await client.clean();
    return;
}