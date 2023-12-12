import { getContext } from '@/lib/context';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { HfInference } from '@huggingface/inference';
import { HuggingFaceStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAssistantPrompt } from 'ai/prompts';
import { Message } from 'ai/react';
import { eq } from 'drizzle-orm';
import build from 'next/dist/build';
import { NextResponse } from 'next/server';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BytesOutputParser } from 'langchain/schema/output_parser';
import { PromptTemplate } from 'langchain/prompts'

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export const runtime = 'edge';
export async function POST(req: Request) {
    // Extract the `messages` from the body of the request
    const { messages, chatId } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId))
    if (_chats.length != 1) {
        return NextResponse.json({ 'error': "chat not found" }, { status: 404 })
    }
    const fileKey = _chats[0].fileKey
    // const context = await getContext(lastMessage, fileKey);

    const prompt = {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
        The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
        AI is a well-behaved and well-mannered individual.
        AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
        AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
        AI assistant is a big fan of Pinecone and Vercel.
        START CONTEXT BLOCK
        ${'hi how are you'}
        END OF CONTEXT BLOCK
        AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
        If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
        AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
        AI assistant will not invent anything that is not drawn directly from the context.
        `,
    };

    // Initialize a text-generation stream using the Hugging Face Inference SDK
    const response = await Hf.textGenerationStream({
        model: 'OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5',
        inputs: messages,
    });

    // Convert the async generator into a friendly text-stream
    const stream = HuggingFaceStream(response);

    // Respond with the stream, enabling the client to consume the response
    return new StreamingTextResponse(stream);
}

//need OpenAI API key
// export async function POST(req: Request) {
//     // Extract the `messages` from the body of the request
//     const { messages, chatId } = await req.json();
//     const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
//     const currentMessageContent = messages[messages.length - 1].content;
//     const _chats = await db.select().from(chats).where(eq(chats.id, chatId))
//     if (_chats.length != 1) {
//         return NextResponse.json({ 'error': "chat not found" }, { status: 404 })
//     }
//     const fileKey = _chats[0].fileKey
//     // const context = await getContext(lastMessage, fileKey);

//     const template =
//         `AI assistant is a brand new, powerful, human-like artificial intelligence.
//         The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
//         AI is a well-behaved and well-mannered individual.
//         AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
//         AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
//         AI assistant is a big fan of Pinecone and Vercel.
//         START CONTEXT BLOCK
//         Current conversation:
//         {chat_history}

//         User: {input}
//         AI:
//         END OF CONTEXT BLOCK
//         AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
//         If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
//         AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
//         AI assistant will not invent anything that is not drawn directly from the context.
//         `
//     const prompt = PromptTemplate.fromTemplate(template);
//     const model = new ChatOpenAI({
        
//         temperature: 0.8,
//     });
//     const outputParser = new BytesOutputParser();
//     const chain = prompt.pipe(model).pipe(outputParser);

//     const stream = await chain.stream({
//         chat_history: formattedPreviousMessages.join('\n'),
//         input: currentMessageContent,
//     });

//     // Respond with the stream, enabling the client to consume the response
//     return new StreamingTextResponse(stream);
// }

// const formatMessage = (message: Message) => {
//     return `${message.role}: ${message.content}`;
// };

