require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Sends a user message, database context, and user identity to OpenRouter AI and returns response + token usage.
 * @param {string} userMessage - The user's query or prompt.
 * @param {string} systemContext - JSON stringified database context data.
 * @param {Object} [user] - User object containing { name, role }
 * @returns {Promise<{ reply: string, usage: Object }>} The text response and usage stats.
 */
async function askAI(userMessage, systemContext = '', user = {}) {
  try {
    const userRole = user?.role || 'user';
    const userName = user?.name || 'User';

    const formattedSystemPrompt = `You are an AI assistant for an IT Asset and Loan Management system.
You are speaking with a user whose role is ${userRole} and name is ${userName}.

Here is the current data you have access to:
${systemContext || "No data available."}

Rules:
- If the user is an admin, you may discuss any asset, loan, or user data provided.
- If the user is a regular user, you may ONLY discuss their own assets, their own loans, and general help topics.
- If a regular user asks about another user's data, respond: 'I can only help you with your own assets and loans.'
- Never reveal internal IDs, other users' names, or admin-only data to a regular user.
- Answer ONLY based on the data provided above.
- If the answer is not in the data, say: 'I don't have that information available.'
- Never invent asset names, loan IDs, dates, or amounts.
- Be concise and use bullet points for lists.`;

    const messages = [
      { role: 'system', content: formattedSystemPrompt },
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: messages,
      max_tokens: 1000,
    });

    const usage = response.usage || {};
    const totalTokens = usage.total_tokens || 0;
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    console.log(`[COST SAFETY] Token usage: ${totalTokens} total (prompt: ${promptTokens}, completion: ${completionTokens})`);
    if (totalTokens > 4000) {
      console.warn(`⚠️ [COST SAFETY WARNING] High token usage detected! (${totalTokens} tokens)`);
    }

    if (response.choices && response.choices.length > 0) {
      return {
        reply: response.choices[0].message.content,
        usage: { totalTokens, promptTokens, completionTokens }
      };
    }

    return { reply: 'No response generated from AI.', usage: {} };
  } catch (error) {
    console.error('Error connecting to OpenRouter AI:', error.message);
    return {
      reply: `AI Error: Unable to process request at this time. (${error.message})`,
      usage: {}
    };
  }
}

module.exports = { askAI };
