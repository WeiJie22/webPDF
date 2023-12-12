import { getEmbeddings } from "./embedding";
import { getPineconeClient } from "./pinecone";
import { convertToAscii } from "./utils";

export async function getMatchesFromEmbeddings(embedding: number[], fileKey: string) {
    const pinecone = getPineconeClient();

    const index = await pinecone.index('chatpdf')

    try {
        const namespace = convertToAscii(fileKey)
        const queryResult = await index.query({
            topK: 5,
            vector: embedding,
            includeMetadata: true,
        })
        return queryResult.matches || []
    } catch (error) {
        console.log('error querying embeddings', error)
    }

}

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query)
    const matches = await getMatchesFromEmbeddings(queryEmbeddings || [], fileKey)

    const qualifyingDocs = matches?.filter(match => match?.score || 0 > 0.7)

    type MetaData = {
        text: string,
        pageNumber: number,
    }

    let docs = qualifyingDocs?.map(match => (match.metadata as MetaData).text)
    return docs?.join('\n').substring(0, 3000)
}