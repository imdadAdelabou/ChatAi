import 'dotenv/config'

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const result = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content:
        'You are an AI helpful assistant, answer any questions to the best of your knowledge',
    },
    { role: 'user', content: 'What is the meaning of life?' },
  ],
})

//prompt_token: is how many the prompt has
//finish_reason: sometine it might respond and might not finish
console.log(result.choices[0].message.content)
