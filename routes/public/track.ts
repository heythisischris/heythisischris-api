export const track = async () => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/vnd.fdf',
            'Content-Disposition': 'inline',
        },
        body: ``,
    };
};