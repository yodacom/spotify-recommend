var unirest = require("unirest");
var express = require("express");
var events = require("events");

var getFromApi = function(endpoint, args){
	var emitter = new events.EventEmitter();
	unirest.get("https://api.spotify.com/v1/" + endpoint)
    .qs(args) //?q=u2&limit=1&type=artist

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


async function getTopTracks(related){
    return await Promise.all(related.map(function(related){

        return new Promise(function(resolve, reject){
            var topTracksReq = getFromApi("artists/"+ related.id +"/top-tracks", {
                country:"US"
            });
            topTracksReq.on("end", function(item){
                related.tracks = item.tracks;
                console.log(related);
                resolve(related);
            });
        });

    }));
}


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
            getTopTracks(artist.related)
                .then(function(related){
                    artist.related = related;
                    res.json(artist);
                });

        });
        relatedReq.on("error", function(code){
            //error occurred
            res.sendStatus(code);
        });

	});

	searchReq.on("error", function(code){
		res.sendStatus(code);
	});
			
});

app.listen(process.env.PORT || 8080);