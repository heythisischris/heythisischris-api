import OpenAI from 'openai';

export const openai = new OpenAI();

export const preparePrompt = (prompt) => {
    return prompt.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}