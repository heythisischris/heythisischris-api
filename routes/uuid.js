import { shortUuid } from '../utils/shortUuid.js';

export const uuid = async ({}) => {
    const uuid = shortUuid();
    return {
        statusCode: 200,
        body: JSON.stringify({ uuid }),
        headers: { 'Access-Control-Allow-Origin': '*' },
    };
};
