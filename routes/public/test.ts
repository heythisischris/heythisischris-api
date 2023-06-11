import { client } from "#src/utils/client"

export const test = async () => {
    await client.connect();
    const results = await client.query(`SELECT * FROM apps`);
    await client.clean();
    return results;
}