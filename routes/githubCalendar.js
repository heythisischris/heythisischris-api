/*global fetch*/
import { S3 } from "@aws-sdk/client-s3";
import { CloudFront } from "@aws-sdk/client-cloudfront";
const s3 = new S3();
const cloudfront = new CloudFront();

export const githubCalendar = async ({}) => {
    const image = await (await (await fetch('https://ghchart.rshah.org/heythisischris')).blob()).arrayBuffer();
    await s3.putObject({
        Bucket: 'heythisischris-files',
        Key: 'githubcalendar.svg',
        ContentType: 'image/svg+xml',
        Body: image,
    });
    await cloudfront.createInvalidation({
        DistributionId: 'EXIG3NHS7PGXY',
        InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: {
                Quantity: 1,
                Items: ['/githubcalendar.svg']
            }
        }
    });
    return;
};
