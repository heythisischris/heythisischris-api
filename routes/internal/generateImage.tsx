import React from 'react';
import { Document, Page, Text, View, Font, Image, pdf } from '@react-pdf/renderer';

export const generateImage = async () => {
    Font.register({
        family: 'Roboto',
        fonts: [
            { src: 'https://uploads.options-insight.com/assets/roboto.ttf' },
            { src: 'https://uploads.options-insight.com/assets/roboto-bold.ttf', fontWeight: 700 },
        ],
    });

    const pdfContent = (
        <Document>
            <Page style={{ fontFamily: 'Roboto', fontSize: 14, padding: 40 }}>
                <View style={{ position: 'relative', marginLeft: -40, marginTop: -40, marginRight: -40, marginBottom: -40 }}>
                    <Image src='https://uploads.options-insight.com/assets/header.jpg' />
                    <View style={{ position: 'absolute', bottom: 20, left: 30, fontSize: 32, fontFamily: 'Roboto', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
                        <View style={{ height: 80 }}>
                            <Text style={{ color: '#ffffff' }}> </Text>
                            <Text style={{ color: '#ffffff' }}>Test</Text>
                        </View>
                    </View>
                    <Text style={{ position: 'absolute', top: 30, right: 30, color: '#ffffff' }}>
                        Test
                    </Text>
                </View>
                <View style={{ marginTop: 60 }}>
                </View>
            </Page>
        </Document>
    );

    const pdfBuffer = await pdf(pdfContent).toBuffer();

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': 'inline; filename="document.pdf"'
        },
        body: pdfBuffer.toString('base64'),
        isBase64Encoded: true
    };
};