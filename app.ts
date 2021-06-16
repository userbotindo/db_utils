import { MongoClient, Collection } from 'mongodb';
import { Telegraf } from 'telegraf';
import fs from 'fs';

const botToken = process.env.BOT_TOKEN;
const ChatId = process.env.CHAT_ID;
const url = process.env.MONGO_URL!;
if (url == null) {
    console.log("No DB URL provided");
    process.exit(1);
}

let fileBuffer: string = fs.readFileSync('wordlist.txt').toString();
let bannedWord: string[] = fileBuffer.replace(/\r\n/g, '\n').split('\n');
let listUser: any[] = []


async function main(): Promise<void> {
    console.log("Connecting to MongoDB");
    try{
        const client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        CleanDB(client);
    } catch (err) {
        console.error("Failed to connect to db ", err);
        process.exit(1);
    }
}


function CleanDB(client: MongoClient): void {
    const col: Collection = client.db("UbotIndo").collection("GBANS");
    col.find({}).toArray((err, data) => {
        if (err) throw err;
        if (data.length) {
            for (let user of data) {
                for (let word of bannedWord) {
                    if ((user.reason).search(escape(word)) != -1) {
                        col.deleteOne({ _id: user._id });
                        AppendUser(user, word, (result) => {
                            listUser.push(result);
                        });
                        break;
                    }
                }
            }
            SendMessage(listUser);
            console.log(`Done deleting ${listUser.length} user(s) from db`);
        } else {
            console.log("No data");
        }
    });
}


function AppendUser(user: any, match: string, callback: (result: any) => void): void {
    let data = {
        id: user._id.toString(),
        name: user.name,
        reason: user.reason,
        matched: match
    }
    callback(data);
}


function SendMessage(deleted: any[]): void {
    if (deleted.length && botToken && ChatId) {
        const bot = new Telegraf(botToken);
        let text: string = `#AUTOCLEAN\nDeleting ${deleted.length} gbanned user!\n`;
        deleted.forEach((value) => {
            let name = `\n× Name: <b>${value.name}</b> with id <b>${value.id}</b>\n`;
            let reason = `   reason: <b>${value.reason}</b> (matching <b>${value.matched}</b>)\n`
            text = text.concat(name, reason);
        })
        bot.telegram.sendMessage(ChatId, text, { parse_mode: "HTML" });
    }
}


if (require.main === module) {
    setTimeout(() => {
        console.log("Exiting...");
        process.exit(0);
    }, 60000)  // set manual timeout of 1 minutes
    main();
}
