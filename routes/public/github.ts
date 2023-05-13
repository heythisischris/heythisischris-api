import { query } from '#src/utils';

export const github = async () => {
    const commits = (await query(`SELECT "content" from htic WHERE "pk"='github' AND "sk"='0'`))[0].content;
    return commits;
};
