import { openai } from './openai.js'
import math from 'advanced-calculator'

const question = process.argv[2] || 'Hi'

const messages = [
  {
    role: 'user',
    content: question,
  },
]

const functions = {
  calculate({ expression }) {
    return math.evaluate(expression)
  },
  async generateImage({ prompt }) {
    const result = await openai.images.generate({ prompt })
    console.log(result)
    return ''
  },
}

const getCompletions = (message) => {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: [
      {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Run math expression',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description:
                  'The math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'generateImage',
          description: 'Generate image based on a description',
          parameters: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description:
                  'The prompt make look like "Generate an image of a future world with aliens and futurist car"',
              },
            },
            required: ['prompt'],
          },
        },
      },
    ],
  })
}

let response
while (true) {
  response = await getCompletions(response)
  console.log(response.choices[0].finish_reason)
  if (response.choices[0].finish_reason === 'stop') {
    console.log(response.choices[0].message)
    break
  } else if (response.choices[0].finish_reason === 'tool_calls') {
    const fName = response.choices[0].message.tool_calls[0].function.name
    const args = response.choices[0].message.tool_calls[0].function.arguments
    console.log(fName)
    console.log(args)
    const funcToCall = functions[fName]
    const argmt = JSON.parse(args)

    const result = funcToCall(argmt)

    messages.push({
      role: 'assistant',
      content: null,
      function_call: {
        name: fName,
        arguments: args,
      },
    })

    messages.push({
      role: 'function',
      name: fName,
      content: JSON.stringify(result),
    })
  }
}
