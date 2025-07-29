export const pixel = async () => {
    console.log('pixel!');
    const pixel = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
        'base64'
    );

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length.toString(),
            'Cache-Control': 'no-cache'
        },
        body: pixel.toString('base64'),
        isBase64Encoded: true,
    };
}