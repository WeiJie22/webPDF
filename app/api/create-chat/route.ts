import { db } from "@/lib/db"
import { chats } from "@/lib/db/schema"
import { getFirebaseDownloadUrl } from "@/lib/firebase-storage"
import { loadFirebaseIntoPinecone } from "@/lib/pinecone"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function POST(req: Request, res: Response) {

    const { userId } = auth();

    if (!userId) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        const body = await req.json()
        const { file_key, file_name } = body
        await loadFirebaseIntoPinecone(file_key)
        const pdfUrl = await getFirebaseDownloadUrl(file_key)
        const chat_id = await db.insert(chats).values({
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: pdfUrl,
            userId: userId,
        }).returning({
            insertedId: chats.id,
        });

        return NextResponse.json({
            chat_id: chat_id[0].insertedId
        }, { status: 200 })
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}