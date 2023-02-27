/* global fetch */
import { SES } from '@aws-sdk/client-ses';
const ses = new SES({ region: 'us-east-1' });

export const contact = async ({ event }) => {
    const { city, region, country } = await (await fetch(`http://ipwho.is/${event.requestContext.identity.sourceIp}`)).json();
    await ses.sendEmail({
        Destination: { ToAddresses: ['chris@heythisischris.com'] },
        Source: 'noreply@heythisischris.com',
        ReplyToAddresses: ['noreply@heythisischris.com'],
        Message: {
            Body: { Html: { Data: `
                ${event.body.name} contacted you from ${event.body.email}.
                <p>Their IP address and location are:</p>
                <ul>
                <li>${event.requestContext.identity.sourceIp}</li>
                <li>${city}, ${region}, ${country}</li>
                </ul>
                <p>Their message is:</p>
                <p>${event.body.message}</p>` } },
            Subject: { Data: `${event.body.name} contacted you from ${event.body.email}` }
        },
    });

    return {
        statusCode: 200,
        body: JSON.stringify('success'),
        headers: { 'Access-Control-Allow-Origin': '*' },
    };
};
