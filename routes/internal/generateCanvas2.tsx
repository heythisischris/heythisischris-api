import fetch from 'node-fetch';
import FormData from 'form-data';

export const generateCanvas2 = async () => {
    try {
        const fullUrl = `https://heythisischris.com`;

        const form = new FormData();
        form.append('url', fullUrl);
        form.append('width', '800');
        form.append('height', '400');
        form.append('clip', 'true');  // This ensures exact dimensions

        const response = await fetch('https://gotenberg.heythisischris.com/forms/chromium/screenshot/url', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) throw new Error(`Gotenberg error: ${response.statusText}`);

        const buffer = await response.buffer();
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Length': buffer.length
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};