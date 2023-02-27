export const age = async ({}) => {
    const age = new Date(new Date().getTime() - new Date(process.env.dateOfBirth).getTime()).getUTCFullYear() - 1970;
    return {
        statusCode: 200,
        body: JSON.stringify({ age }),
        headers: { 'Access-Control-Allow-Origin': '*' },
    };
};
