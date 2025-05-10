import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config(); // Load .env file

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
   
});

// --- Define your local functions that OpenAI can call (default tools) ---
const get_weather = (location, unit = "celsius") => {
    console.log(`[ChatService] get_weather called with location: ${location}, unit: ${unit}`);
    if (location.toLowerCase().includes("tokyo")) {
        return JSON.stringify({ location: "Tokyo", temperature: "10", unit: unit });
    } else if (location.toLowerCase().includes("san francisco")) {
        return JSON.stringify({ location: "San Francisco", temperature: "72", unit: unit });
    } else {
        return JSON.stringify({ location: location, temperature: "22", unit: unit });
    }
};

const defaultTools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Get the current weather in a given location",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The city and state, e.g. San Francisco, CA",
                    },
                    unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                },
                required: ["location"],
            },
        },
    },
];

/**
 * Processes a chat request, interacting with OpenAI and handling tool calls.
 * @param {Array<object>} userMessages - The list of messages from the user/client (excluding any system prompt to be prepended).
 * @param {string} [systemPrompt] - An optional system prompt to prepend to the conversation.
 * @param {Array<object>|null} [toolsOverride] - Optional array of tools to use. Pass null or empty array for no tools.
 * @param {number} [temperatureOverride] - Optional temperature setting for the API call.
 * @returns {Promise<string | null>} The final response content from the assistant.
 * @throws {Error} If there's an issue.
 */
const processChat = async (userMessages, systemPrompt = null, toolsOverride = defaultTools, temperatureOverride = 0.7) => {
    if (!userMessages || userMessages.length === 0) {
        throw new Error("User messages are required.");
    }

    let currentMessages = userMessages.map(m => ({
        role: m.role,
        content: m.content
    }));

    if (systemPrompt) {
        currentMessages.unshift({ role: "system", content: systemPrompt });
    }

    console.log("[ChatService] Starting chat process with messages:", JSON.stringify(currentMessages, null, 2));

    const effectiveTools = toolsOverride === null || toolsOverride.length === 0 ? undefined : toolsOverride;
    const toolChoiceSetting = effectiveTools ? "auto" : undefined;

    let openaiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: currentMessages,
        tools: effectiveTools,
        tool_choice: toolChoiceSetting,
        temperature: temperatureOverride
    });

    let responseMessage = openaiResponse.choices[0].message;
    console.log("[ChatService] First OpenAI response:", JSON.stringify(responseMessage, null, 2));

    const maxToolCallAttempts = effectiveTools ? 5 : 0; // No tool call attempts if no tools are provided
    let attempts = 0;

    while (responseMessage.tool_calls && attempts < maxToolCallAttempts && effectiveTools) {
        attempts++;
        currentMessages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            let functionResponseContent = "";

            console.log(`[ChatService] Attempting to call function: ${functionName} with args:`, functionArgs);

            if (functionName === "get_weather") {
                functionResponseContent = get_weather(functionArgs.location, functionArgs.unit);
            }
            else {
                console.warn(`[ChatService] Function ${functionName} not found or not implemented.`);
                functionResponseContent = `Error: Function ${functionName} is not implemented on the server.`;
            }
            
            currentMessages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: functionResponseContent,
            });
        }
        console.log("[ChatService] Messages before next OpenAI call:", JSON.stringify(currentMessages, null, 2));

        openaiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages: currentMessages,
            tools: effectiveTools,
            tool_choice: toolChoiceSetting,
            temperature: temperatureOverride
        });
        responseMessage = openaiResponse.choices[0].message;
        console.log(`[ChatService] OpenAI response after tool call attempt ${attempts}:`, JSON.stringify(responseMessage, null, 2));
    }

    if (responseMessage.tool_calls && effectiveTools) {
        console.error("[ChatService] Model continued to request tool calls after maximum attempts.");
        return responseMessage.content || "The assistant tried to use tools multiple times without reaching a conclusion.";
    }

    return responseMessage.content;
};

export { processChat };
