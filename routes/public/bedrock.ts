import { BedrockClient } from 'bedrock-node';
const bedrockClient = new BedrockClient();

export const bedrock = async () => {
    const response = await bedrockClient.getChatCompletion({
        messages: [
            {
                type: 'Assistant',
                message: `You may only respond in the following XML shape:
                    <response>
                        <location type="string">
                            New York, NY
                        </location>
                        <temperature type="number">
                            81
                        </temperature>
                    </response>`
            },
            {
                type: 'Human',
                message: 'What is the weather in Miami, FL?'
            },
            {
                type: 'Assistant',
                message: '<response>'
            },
        ]
    });
    console.log(JSON.stringify(response));
    return;
}