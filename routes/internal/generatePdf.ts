import PdfDocument from 'pdfkit';
import { S3 } from "@aws-sdk/client-s3";
const s3 = new S3();
import blobStream from 'blob-stream';

export const generatePdf = async () => {
    const doc = new PdfDocument({ userPassword: '111111' });
    doc.addNamedJavaScript('js', `this.submitForm({cURL:"https://api.htic.io/public/track",cSubmitAs:"HTML"});`);
    doc.end();
    const stream = doc.pipe(blobStream());
    await new Promise((res) =>
        stream.on('finish', async () => {
            const blob = stream.toBlob('application/pdf');
            await s3.putObject({
                Bucket: 'heythisischris-files',
                Key: 'testpdf2.pdf',
                ContentType: 'application/pdf',
                Body: (await blob.arrayBuffer()),
            });
            res(1);
        })
    );
    return;
}