
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromFirebase } from "./firebase-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { Document, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter'
import { getEmbeddings } from "./embedding";
import md5 from "md5";
import { convertToAscii } from "./utils";

export const getPineconeClient = () => {
    return new Pinecone({
        environment: process.env.PINECONE_ENV!,
        apiKey: process.env.PINECONE_API_KEY!,
    })
}

type PDFPage = {
    pageContent: string,
    metadata: {
        loc: { pageNumber: number }
    }
}

export async function loadFirebaseIntoPinecone(fileKey: string) {
    const file_name = await downloadFromFirebase(fileKey);

    if (!file_name) {
        throw new Error('file not found')
    }

    const loader = new PDFLoader(file_name);
    const pages = await loader.load() as PDFPage[];

    const documents = await Promise.all(pages.map(prepareDocument));

    const vectors = await Promise.all(documents.flat().map(embedDocument));


    const client = getPineconeClient();
    const pineconeIndex = client.index('chatpdf');
    console.log('inserting vectors into pinecone')

    // PineconeBadRequestError: The requested feature 'Namespaces' is not supported by the current index type 'Starter'.
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey))

    await pineconeIndex.upsert(vectors)
    console.log('finished inserting vectors into pinecone')

    return documents[0];
}

async function embedDocument(doc: Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)
        return {
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            }
        } as PineconeRecord
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const truncateStringByBytes = (str: string, bytes: number) => {
    const enc = new TextEncoder();
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage) {
    let { pageContent, metadata } = page;
    pageContent = pageContent.replace(/\n/g, '');
    const splitter = new RecursiveCharacterTextSplitter();
    const docs = splitter.splitDocuments([
        new Document({
            pageContent,
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])
    return docs;
}