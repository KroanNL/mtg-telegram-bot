var http = require("http");  
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var restler = require("restler");
var fs = require('fs');

var app = express();
app.use(bodyParser.json());

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

app.listen(port,ipaddress,function()
    {
       console.log("Listening on ipaddress " + ipaddress + " on port " + port); 
    });

app.get('', function(req,res)
    {
       res.send('MTG Telegram Bot by Kroan is running...');
    });

app.post('/getCard',function(req,res)
    {      
      console.log(req.body);
      
      
      if(!req.body.message.text || JSON.stringify(req.body.message.text).indexOf("/getcard") != 1) 
      {
          res.end("yes");
          return;
      }
      
      var cardname = JSON.stringify(req.body.message.text);                
      cardname = cardname.substring(cardname.indexOf(" ")+1,cardname.length-1);
      cardname = cardname.replace(/\W+/g, " ")      
      
      var messageID = JSON.stringify(req.body.message.message_id);
      var chatID = JSON.stringify(req.body.message.chat.id);
      
      request('http://api.mtgdb.info/cards/' + cardname, function(err, response, body)
      {
            if(!err && response.statusCode == 200)
            {
                if(body.length <= 2)
                {
                      // Can't find the card directly, go search for it. 
                      request('http://api.mtgdb.info/search/' + cardname + '?limit=1', function(err, response, body)
                      {
                        if(!err && response.statusCode == 200)
                        {
                            if(body.length <= 2)
                            {
                                restler.post("https://api.telegram.org/bot122225250:AAG0XoX_tB7iWiZoKmovhxGyOULzfg7J6PU/sendMessage", {
                                        multipart: false,
                                        data: {
                                            "chat_id": chatID,                                
                                            "text": "I could not find this card. Sorry :(",
                                            "reply_to_message_id": messageID
                                        }
                                    }).on("complete", function(data) {
                                        console.log(data);
                                    });                           
                            }
                            else
                            {
                                sendCardAsTelegramMessage(body, cardname, chatID, messageID);
                            }
                            
                        } 
                      }); 
                }
                else
                {
                    sendCardAsTelegramMessage(body, cardname, chatID, messageID);
                }
            }          
      });
         
      res.send(cardname); 
      res.end("yes");
    });
    
function sendCardAsTelegramMessage(body, cardname, chatID, messageID)
{    
    var jsonBody = JSON.parse(body);
    var imageName = JSON.stringify(jsonBody[jsonBody.length - 1].id) + ".jpeg";
    cardname = JSON.stringify(jsonBody[jsonBody.length - 1].name);
    cardname = cardname.substring(1,cardname.length-1);
                    
    /*var imageFile = fs.createWriteStream(imageName);
    
    var options={
        host:'api.mtgdb.info',
        port:80,
        path:"/content/card_images/" + imageName
    };
    
    http.get(options,function(res){
        res.on('data', function (chunk) {
            imageFile.write(chunk);
        });
        res.on('end',function(){
            imageFile.end();
            
            fs.stat(imageName, function(err, stats) 
                    {
                        console.log(imageName);
                        console.log(stats.size);
                        restler.post("https://api.telegram.org/bot122225250:AAG0XoX_tB7iWiZoKmovhxGyOULzfg7J6PU/sendPhoto", {
                            multipart: true,
                            data: {
                                "chat_id": chatID,
                                "photo": restler.file(imageName, null, stats.size, null, "image/jpg"),
                                "caption": '"' + cardname + '"',
                                "reply_to_message_id": messageID
                            }
                        }).on("complete", function(data) {
                            console.log("Restler complete");
                            console.log(data);
                        });
                    });                        
        });
    });*/
    
    restler.post("https://api.telegram.org/bot122225250:AAG0XoX_tB7iWiZoKmovhxGyOULzfg7J6PU/sendMessage", {
            multipart: false,
            data: {
                "chat_id": chatID,                                
                "text": "http://api.mtgdb.info/content/card_images/" + imageName,
                "reply_to_message_id": messageID
            }
        }).on("complete", function(data) {
            console.log(data);
        });       
    
    return;
}