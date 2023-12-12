import axios from 'axios';
import { OpenAIApi, Configuration } from 'openai-edge';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY!,
})

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
    try {
        const response = await axios.post('http://127.0.0.1:5000/api/getEmbeddings', {
            input: text.replace(/\n/g, ''),
        })

        const result = await response.data
        return result as number[] || []
    } catch (error) {
        console.log(error)
    }
}