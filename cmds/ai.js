const axios = require("axios");
const { sendMessage } = require('../handles/message');

module.exports = {
  name: "ai",
  description: "Ai Pro + Gemini Pro",
  role: 1,
  author: "Mark Martinez",

  async execute(bot, args, authToken, event) {
    if (!event?.sender?.id) {
      console.error('Invalid event object: Missing sender ID.');
      sendMessage(bot, { text: 'Error: Missing sender ID.' }, authToken);
      return;
    }

    const senderId = event.sender.id;
    const userPrompt = args.join(" ");
    const repliedMessage = event.message.reply_to?.message || ""; // Get the replied message content
    const finalPrompt = repliedMessage ? `${repliedMessage} ${userPrompt}`.trim() : userPrompt; // Combine reply + user input

    if (!finalPrompt) {
      return sendMessage(bot, { text: "Please enter your question or reply with an image to analyze." }, authToken);
    }

    try {
      const imageUrl = await extractImageUrl(event, authToken);

      if (imageUrl) {
        // If an image is detected, use Gemini Vision API
        const apiUrl = `https://apis-rho-nine.vercel.app/gemini`;
        const response = await handleImageRecognition(apiUrl, finalPrompt, imageUrl);
        const result = response.description;

        const visionResponse = `[ GEMINI 2.0 ]\n\n${result}`;
        sendLongMessage(bot, visionResponse, authToken);
      } else {
        // If no image, use GPT API.  https://rest-api-bot.onrender.com/api/chatgpt?query=${encodeURIComponent(finalPrompt)}`;
        const apiUrl = `https://apis-rho-nine.vercel.app/gemini?ask=${encodeURIComponent(finalPrompt)}`;
        //https://rest-api-french3.onrender.com/api/clarencev2`;
        const response = await axios.get(apiUrl, finalPrompt);
        const gptMessage = response.data.description;
        
   //   const apiUrl = `https://simpleapi-seven.vercel.app/gemini-2.0pro`;
    //    const response = await handleImageRecognition(apiUrl, finalPrompt, imageUrl);
      //  const gptMessage = response.data.description;


        const gptResponse = `${gptMessage}`;
        sendLongMessage(bot, gptResponse, authToken);
      }
    } catch (error) {
      console.error("Error in AI command:", error);
      sendMessage(bot, { text: `Error: ${error.message || "Something went wrong."}` }, authToken);
    }
  }
};

async function handleImageRecognition(apiUrl, prompt, imageUrl) {
  try {
    const { data } = await axios.get(apiUrl, {
      params: {
        ask: prompt,
        imagurl: imageUrl || ""
      }
    });
    return data;
  } catch (error) {
    throw new Error("Failed to connect to the Gemini Vision API.");
  }
}

async function extractImageUrl(event, authToken) {
  try {
    if (event.message.reply_to?.mid) {
      return await getRepliedImage(event.message.reply_to.mid, authToken);
    } else if (event.message?.attachments?.[0]?.type === 'image') {
      return event.message.attachments[0].payload.url;
    }
  } catch (error) {
    console.error("Failed to extract image URL:", error);
  }
  return "";
}

async function getRepliedImage(mid, authToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: authToken }
    });
    return data?.data[0]?.image_data?.url || "";
  } catch (error) {
    throw new Error("Failed to retrieve replied image.");
  }
}

function sendLongMessage(bot, text, authToken) {
  const maxMessageLength = 2000;
  const delayBetweenMessages = 1000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);
    sendMessage(bot, { text: messages[0] }, authToken);

    messages.slice(1).forEach((message, index) => {
      setTimeout(() => sendMessage(bot, { text: message }, authToken), (index + 1) * delayBetweenMessages);
    });
  } else {
    sendMessage(bot, { text }, authToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const regex = new RegExp(`.{1,${chunkSize}}`, 'g');
  return message.match(regex);
}
