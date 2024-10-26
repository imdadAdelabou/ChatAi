import 'dotenv/config'
import { Document } from 'langchain/document'
import { MemoryVectorStore } from 'langchain/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { CharacterTextSplitter } from 'langchain/text_splitter'
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { openai } from './openai.js'

const question = process.argv[2] || 'hi'
const video = 'https://youtu.be/zR_iuq2evXo?si=cG8rODgRgXOx9_Cn'

const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings())

export const docsFromYTVideo = async (video) => {
  const loader = YoutubeLoader.createFromUrl(video, {
    language: 'fr',
    addVideoInfo: true,
  })

  const doc = await loader.load()

  return new CharacterTextSplitter({
    separator: ' ',
    chunkSize: 2500,
    chunkOverlap: 200,
  }).splitDocuments(doc)
}

export const docsFromPdf = async () => {
  const loader = new PDFLoader('tournoiCms.pdf')

  const doc = await loader.load()

  return new CharacterTextSplitter({
    separator: '. ',
    chunkSize: 2500,
    chunkOverlap: 200,
  }).splitDocuments(doc)
}

export const loadStore = async () => {}

const query = async () => {
  // const docs = await docsFromYTVideo(
  //   'https://www.youtube.com/watch?v=4-079YIasck'
  // )
  const docs = await docsFromPdf()
  const store = await createStore(docs)
  const results = await store.similaritySearch(question, 2)
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content:
          'You are a helpful assistant. Answer questions to your best ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you cannot answer the question with the context, you can make a search on the web but don’t lie and make up stuff. Question is: ${question}. Context is ${results
          .map((r) => r.pageContent)
          .join('\n')}`,
      },
    ],
  })

  console.log(
    `Answer: ${response.choices[0].message.content}\nSources: ${results
      .map((r) => r.metadata.source)
      .join(', ')}`
  )
}

query()
