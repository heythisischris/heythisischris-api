import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { XMLParser } from "fast-xml-parser";
export const parser = new XMLParser();
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const bedrockChat = async (messages, tokens = 8191) => {
    const response = JSON.parse(Buffer.from((await bedrockClient.send(new InvokeModelCommand({
        contentType: 'application/json',
        modelId: 'anthropic.claude-v2',
        body: Buffer.from(JSON.stringify({
            prompt: [
                { type: 'Human', message: '' },
                ...messages,
                { type: 'Assistant', message: '' }
            ].map(({ type, message }) => `${type}: ${prepareBedrockPrompt(message)}`).join('\n\n'),
            max_tokens_to_sample: tokens,
        })),
    })))?.body).toString())?.completion;
    return response;
}

export const bedrockEmbedding = async (inputText) => {
    const response = JSON.stringify(JSON.parse(Buffer.from((await bedrockClient.send(new InvokeModelCommand({
        contentType: 'application/json',
        modelId: 'amazon.titan-embed-text-v1',
        body: Buffer.from(JSON.stringify({ inputText })),
    })))?.body).toString())?.embedding);
    return response;
}

export const prepareBedrockPrompt = (prompt) => {
    return prompt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}