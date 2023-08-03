import {Request, Response} from "express";
import * as functions from "firebase-functions/v2";
import {onRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as serviceAccount from "./service_account_key.json";
import {ServiceAccount} from "firebase-admin";
import {BufferMemory} from "langchain/memory";
import {FirestoreChatMessageHistory} from "langchain/stores/message/firestore";
import {ChatOpenAI} from "langchain/chat_models/openai";
import {ConversationChain} from "langchain/chains";
import cors from "cors";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
});

const corsHandler = cors({origin: true});

const memory = new BufferMemory({
    chatHistory: new FirestoreChatMessageHistory({
        collectionName: "langchain",
        sessionId: "lc-example",
        userId: "a@example.com",
        config: {
            projectId:
                "skmagic-chatbot-develop",
        },
    }),
});
const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
});
const chain = new ConversationChain({llm: model, memory});

exports.helloWorld = onRequest({region: "asia-northeast3"},
    (req: Request, res: Response) => {
        functions.logger.info("Hello logs!", {structuredData: true});
        res.send("Hello from Firebase!");
    },
);

exports.chatbot = onRequest({region: "asia-northeast3"},
    async (req: Request, res: Response) => {
        corsHandler(req, res, async () => {
            functions.logger.info("[chatbot]", {structuredData: true});
            const data = req.query;
            const res1 = await chain.call({input: data["question"]});
            res.send(res1);
        });
    },
);
