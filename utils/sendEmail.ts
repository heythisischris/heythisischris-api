import { SES } from '@aws-sdk/client-ses';
const ses = new SES({ region: 'us-east-1' });

export const sendEmail = async ({ to, subject, body }) => {
    await ses.sendEmail({
        Destination: { ToAddresses: [to] },
        Source: 'noreply@heythisischris.com',
        Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: body } },
        },
    });
}