const axios = require('axios');
const { sendMessage } = require('../handles/message'); // Ensure the path is correct

module.exports = {
  name: 'lyrics',
  description: 'Fetch song lyrics',
  author: 'Deku (rest api)',
  role: 1,

  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ');
    try {
      const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/lyrics-finder?title=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data && data.response) {
        const lyricsMessage = `Title: ${data.Title}\nAuthor: ${data.author}\n\n${data.response}`;

        await sendResponseInChunks(senderId, lyricsMessage, pageAccessToken);

        if (data.Thumbnail) {
          await sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: {
                url: data.Thumbnail,
                is_reusable: true,
              },
            },
          }, pageAccessToken);
        }
      } else {
        console.error('Error: No lyrics found in the response.');
        await sendMessage(senderId, { text: 'Sorry, no lyrics were found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error calling Lyrics API:', error);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  },
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
