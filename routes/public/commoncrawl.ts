// commoncrawl-poc.js
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import { createInterface } from 'readline';
import { event } from '#src/utils';
const s3Client = new S3Client({ region: 'us-east-1' });

export const commoncrawl = async () => {
    const crawlId = 'CC-MAIN-2023-50', limit = 10;
    const query = event.queryStringParameters.q;

    const indexFiles = await findIndexFiles(crawlId);
    console.log(`Found ${indexFiles.length} index files`);

    const sampleFile = indexFiles[0];
    console.log(`Searching file: ${sampleFile}`);

    const matches = await searchIndex(sampleFile, query, limit);
    console.log(`Found ${matches.length} matches`);

    let content = null;
    if (matches.length > 0) {
        const topMatch = matches[0];
        console.log(`Fetching content for: ${topMatch.url}`);
        content = await fetchContent(topMatch);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            query,
            totalMatches: matches.length,
            results: matches,
            sampleContent: content
        })
    };
};

// Find available index files for the specified crawl
async function findIndexFiles(crawlId) {
    // Look for smaller columnar index files for faster processing
    const prefix = `cc-index/table/${crawlId}/indices/`;

    const command = new ListObjectsV2Command({
        Bucket: 'commoncrawl',
        Prefix: prefix,
        MaxKeys: 5 // Limit to a few files for the POC
    });

    const response = await s3Client.send(command);
    console.log(response);
    return response.Contents.map(obj => obj.Key);
}

// Search through an index file for the query term
async function searchIndex(indexFile, query, limit) {
    const command = new GetObjectCommand({
        Bucket: 'commoncrawl',
        Key: indexFile
    });

    const response = await s3Client.send(command);

    // Set up streaming decompression
    const gunzip = createGunzip();
    const responseBodyStream = Readable.fromWeb(response.Body);
    responseBodyStream.pipe(gunzip);

    // Process line by line
    const results = [];
    const rl = createInterface({
        input: gunzip,
        crlfDelay: Infinity
    });

    // The query is case-insensitive
    const queryLower = query.toLowerCase();

    for await (const line of rl) {
        // For POC, we're doing a simple string search in the line
        // In production, you'd want more sophisticated matching
        if (line.toLowerCase().includes(queryLower)) {
            try {
                // Parse the line (CDXJ format)
                const parts = line.trim().split(' ', 3);
                if (parts.length >= 3) {
                    const urlKey = parts[0];
                    const timestamp = parts[1];
                    const jsonData = JSON.parse(parts[2]);

                    // Check if URL contains our query term for better relevance
                    if (urlKey.toLowerCase().includes(queryLower)) {
                        results.push({
                            url: urlKey,
                            timestamp,
                            filename: jsonData.filename,
                            offset: jsonData.offset,
                            length: jsonData.length,
                            mime: jsonData.mime,
                            status: jsonData.status
                        });

                        if (results.length >= limit) {
                            break;
                        }
                    }
                }
            } catch (error) {
                console.error('Error parsing line:', error);
                continue;
            }
        }
    }

    return results;
}

// Fetch actual content for a search result
async function fetchContent(result) {
    // Only retrieve content for successful responses
    if (result.status !== 200) {
        return `Skip content fetch: status ${result.status}`;
    }

    // For text content, fetch from WET files (extracted text)
    // Convert from WARC filename to corresponding WET filename
    let wetFilename = result.filename;
    if (wetFilename.includes('/warc/')) {
        wetFilename = wetFilename.replace('/warc/', '/wet/').replace('.warc.gz', '.wat.gz');
    }

    try {
        const command = new GetObjectCommand({
            Bucket: 'commoncrawl',
            Key: wetFilename,
            Range: `bytes=${result.offset}-${result.offset + result.length - 1}`
        });

        const response = await s3Client.send(command);

        // Convert the response body to a string
        const chunks = [];
        const stream = Readable.fromWeb(response.Body);
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        // For POC, just return a portion of the content
        const content = Buffer.concat(chunks).toString('utf-8');
        return content.substring(0, 1000) + '...'; // First 1000 chars
    } catch (error) {
        console.error(`Error fetching content: ${error}`);
        return `Error fetching content: ${error.message}`;
    }
}