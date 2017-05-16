var unirest = require("unirest");
var express = require("express");
var events = require("events");

var getFromApi = function(endpoint, args){
	var emitter = new events.EventEmitter();
	unirest.get("https://api.spotify.com/v1/" + endpoint)
    .qs(args)
    .end(function(response){
	if (response.ok) {
		emitter.emit("end",response.body);
	}
	else {
		emitter.emit("error", response.code);
	}
});
	return emitter;
};

var app = express();
app.use(express.static("public"));

app.get("/search/:name", function(req,res){
	console.log(req.params);
	var searchReq = getFromApi("search", {
		q: req.params.name,
		limit: 1,
		type: "artist"
	});

	searchReq.on("end", function(item){
		var artist = item.artists.items[0];
		//we successfully retrieved an artist
        //now find related artist
		var relatedReq = getFromApi("artists/" + artist.id + "/related-artists", {});
		relatedReq.on("end", function(item){
            //successful return
			artist.related = item.artists;
			res.json(artist);
		});
		relatedReq.on("error", function(code){
            //error occurred
			res.sendStatus(code);
		});
		// // getting artist Top Tracks

		// 	var topTracksReq = getFromApi("artists/" + artist.id + "/top-tracks" + "USA",{});
		// 	// console.log(topTracks);
		// 	topTracksReq.on("end", function(item){
		// 				//successful return
		// 		artist.topTracks = item.artists;
		// 		res.json(artist);
		// 	});
		// 	topTracksReq.on("error", function(code){
		// 			//error occurred
		// 		res.sendStatus(code);
		// 	});
	 });
});

app.listen(process.env.PORT || 8080);