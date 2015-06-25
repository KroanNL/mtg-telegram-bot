var http = require("http");  
var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var restler = require("restler");
var fs = require('fs');

var app = express();
app.use(bodyParser.json());

app.listen(3000,function()
    {
       console.log("Listening on port 3000"); 
    });

app.post('/getCard',function(req,res)
    {      
      var cardname = JSON.stringify(req.body.message.text);      
      cardname = cardname.substring(cardname.indexOf(" ")+1,cardname.length-1);
      
      var messageID = JSON.stringify(req.body.message.message_id);
      var chatID = JSON.stringify(req.body.message.chat.id);
      
      
      request('http://api.mtgdb.info/search/' + cardname + '?limit=1', function(err, response, body)
          {
            if(!err && response.statusCode == 200)
            {
                var jsonBody = JSON.parse(body);
                var imageName = JSON.stringify(jsonBody[0].id) + ".jpeg";
                                
                var imageFile = fs.createWriteStream(imageName);
                
                var options={
                    host:'api.mtgdb.info',
                    port:80,
                    path:"/content/card_images/" + imageName
                }
                
                http.get(options,function(res){
                    res.on('data', function (chunk) {
                        imageFile.write(chunk);
                    });
                    res.on('end',function(){
                        imageFile.end();
                        
                        fs.stat(imageName, function(err, stats) 
                                {
                                    console.log(err);
                                    restler.post("https://api.telegram.org/bot122225250:AAG0XoX_tB7iWiZoKmovhxGyOULzfg7J6PU/sendPhoto", {
                                        multipart: true,
                                        data: {
                                            "chat_id": chatID,
                                            "photo": restler.file(imageName, null, stats.size, null, "image/jpeg"),
                                            "caption": '"' + cardname + '"',
                                            "reply_to_message_id": messageID
                                        }
                                    }).on("complete", function(data) {
                                        console.log("Restler complete");
                                        console.log(data);
                                    });
                                });                        
                    });
                });
            } 
          });   
      
      
      res.send(cardname); 
      res.end("yes");
    });