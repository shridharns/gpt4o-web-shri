const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// Load environment variables from .env file
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' })); // To handle large payloads

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,  // Include the session token
  region: 'us-east-1'
});

app.post('/synthesize', async (req, res) => {
  const { text, voice } = req.body;
  
  const polly = new AWS.Polly({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,  // Include this line if using session tokens
  });

  const params = {
    OutputFormat: "mp3",
    Text: text,
    VoiceId: voice, // Use the provided voice
    Engine: "generative", // Use the generative engine
    LanguageCode: "en-US" // Specify the language code
  };

  try {
    const data = await polly.synthesizeSpeech(params).promise();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': data.AudioStream.length
    });
    res.send(data.AudioStream);
  } catch (error) {
    console.error('Error with text-to-speech synthesis:', error);
    res.status(500).send('Error with text-to-speech synthesis');
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('offer', (offer) => {
    console.log('Offer received:', offer);
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    console.log('Answer received:', answer);
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    console.log('ICE candidate received:', candidate);
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('image-data', async (data) => {
    try {
      const response = await sendImageToOpenAI(data.image);
      socket.emit('response', { text: response });
    } catch (error) {
      console.error('Error processing image data:', error);
      socket.emit('response', { text: 'Error processing image data' });
    }
  });

  socket.on('images-data', async (data) => {
    try {
      const response = await sendImagesToOpenAI(data.images);
      socket.emit('response', { text: response });
    } catch (error) {
      console.error('Error processing images data:', error);
      socket.emit('response', { text: 'Error processing images data' });
    }
  });

  socket.on('audio-data', async (audioBlob) => {
    try {
      const response = await sendAudioToOpenAI(audioBlob);
      socket.emit('response', { text: response });
    } catch (error) {
      console.error('Error processing audio data:', error);
      socket.emit('response', { text: 'Error processing audio data' });
    }
  });

  socket.on('message', async (data) => {
    try {
      const response = await sendTextToOpenAI(data.context);
      socket.emit('response', { text: response });
    } catch (error) {
      console.error('Error sending message to OpenAI:', error.response ? error.response.data : error.message);
      socket.emit('response', { text: 'Error processing request' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const sendAudioToOpenAI = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );
    return response.data.text;
  } catch (error) {
    console.error('Error sending audio to OpenAI:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const sendImageToOpenAI = async (base64Image) => {
  try {
    const cleanedBase64Image = base64Image.replace(/\n/g, '').replace(/ /g, '');
    const dataUrl = `data:image/jpeg;base64,${cleanedBase64Image}`;

    const payload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe what you see in the image. Offer help to the student by responding like a very experienced teacher, but one with patience. Please provide the response in Markdown format with LaTeX enclosed in single dollar signs for inline math and double dollar signs for block math. For example: - Inline math: $E = mc^2$ - Block math:$$E = mc^2$$'
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    };

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending image to OpenAI:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const sendImagesToOpenAI = async (images) => {
  try {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze the sentiment of the user in these images. Respond with a positive tone. Please provide the response in Markdown format with LaTeX enclosed in single dollar signs for inline math and double dollar signs for block math. For example: - Inline math: $E = mc^2$ - Block math:$$E = mc^2$$'
          },
          ...images.map(image => ({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${image.image.replace(/\n/g, '').replace(/ /g, '')}`
            }
          }))
        ]
      }
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending images to OpenAI:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const sendTextToOpenAI = async (context) => {
  try {
    const systemMessage = {
      role: 'system',
      content: 'Please provide the response in Markdown format with LaTeX enclosed in single dollar signs for inline math and double dollar signs for block math. For example: - Inline math: $E = mc^2$ - Block math:$$E = mc^2$$'
    };

    const messages = [systemMessage, ...context];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending message to OpenAI:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
