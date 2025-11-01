const axios = require('axios');
const { sendMessage } = require('../handles/message'); // Adjust the path as necessary

module.exports = {
  name: 'aidetect',
  description: 'Detect if a text was written by an AI or a human',
  author: 'GeoDevz69',
  role: 1,
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    try {
      const apiUrl = `https://zen-api.gleeze.com/api/ai-detector?text=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const { result } = response.data;

      const fullResponse = `Result:\n\n${result}`;

      await sendResponseInChunks(senderId, fullResponse, pageAccessToken);
    } catch (error) {
      console.error('Error calling AI Detection API:', error.message);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

async function sendResponseInChunks(senderId, text, pageAccessToken) {
  const maxMessageLength = 2000;
  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  let chunk = '';
  const words = message.split(' ');

  for (const word of words) {
    if ((chunk + word).length > chunkSize) {
      chunks.push(chunk.trim());
      chunk = '';
    }
    chunk += `${word} `;
  }

  if (chunk) {
    chunks.push(chunk.trim());
  }

  return chunks;
}

