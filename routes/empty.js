export const empty = async ({}) => {
    return {
        statusCode: 200,
        body: 'Hey there, here are some endpoints you can check out: /posts, /github, & /uuid. Cheers!',
        headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' },
    };
};
