"use strict";

const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const url = process.env.MONGO_URL;
if(url == null){
    console.log("No DB URL provided");
    process.exit(1);
}

var BannedWords = fs.readFileSync("wordlist.txt").toString();
BannedWords = BannedWords.replace(/\r\n/g,'\n').split('\n');


console.log("Connecting to DB");

MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    if(err){
        console.log("Unable to connect to DB\n", err);
        process.exit(1);
    } else {
        console.log("connected");
        const col = client.db("UbotIndo").collection("GBANS");

        col.find({}).toArray((err, data) => {
            if(err){
                console.log(err);
            } else {
                console.log("cleaning banned user");
                let deleted = 0;
                if(data.length){
                    for(let user of data){
                        for(let banned of BannedWords){
                            if((user.reason).search(banned) != -1){  // delete if match
                                col.deleteOne({_id: user._id});
                                deleted++;
                                break;
                            };
                        }
                    }
                    console.log(`Done deleting ${deleted} user from DB`);
                } else {
                    console.log("No data on collection.");
                }
            }
            client.close();
        })
    }
})
