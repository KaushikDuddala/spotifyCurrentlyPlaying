/* Get dependancies and config */
const http = require("http");
const fetch = require('node-fetch')
const request = require('request')
const fs = require('fs')
const { client_id, client_secret, refreshToken } = require('./config.json')

/* Function to get token from file */
async function grabToken(){
	let token = await fs.readFileSync('./token.txt', 'utf8')
	return token
}

/* Function to request new access token using refresh token if required */
async function refresh(){
	const authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
		form: {
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		},
		json: true
	};
	
	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			console.log(access_token)
			fs.writeFileSync('./token.txt', access_token)
		}else if(error){
			console.log(error)
		}else{
			console.log(response.statusCode)
		}
	});
}


/* Function to grab currently playing song*/
async function retrieve(){
	try {
		let token = await grabToken()
		let options = await {
			method:"GET",
			headers:{Authorization:`Bearer    ${token}`}
		}
		const res = await fetch('http://api.spotify.com/v1/me/player/currently-playing', options);
		switch(res.status){
			case 401:
				refresh()
				break
			case 204:
				return console.log("No song currently playing.")
				break
			case 200:
				const format = await res.json();
				if(format.currently_playing_type == 'ad'){return console.log("Playing an ad currently.")}
				let progress = Math.round(format.progress_ms/1000)
				let pMin = 0;
				let length = Math.round(format.item.duration_ms/1000)
				let pLen = 0;
				let currentProg = Math.round((format.item.duration_ms - format.progress_ms )/1000)
				let currentPrUnRound = (format.item.duration_ms - format.progress_ms )
				let cProgMin = 0;
				let forCurProg = currentProg
				while(forCurProg > 60){
					cProgMin++
					forCurProg = forCurProg-60
				}
				while (progress > 60){
					pMin++
					progress = progress-60
					
				}
				while(length > 60){
					pLen++
					
					length = length - 60
				}
				const current = {
					name:format.item.name,
					link:format.item.external_urls.spotify,
					albumLink:format.context.external_urls.spotify,
					albumName:format.item.album.name,
					progressFormatted:`${pMin}:${progress}`,
					progress:format.progress_ms,
					lengthFormatted:`${pLen}:${length}`,
					length:format.item.duration_ms,
					albumImage:format.item.album.images[0].url,
					prog:currentProg,
					endTimestamp:`${Math.round((Date.now() / 1000)+currentProg)}`
				}
				return console.log(current)
				break
			default:
				console.log(res)
		}
	} catch (err) {
		console.error(err.message);
	}
}

/* Setting repeating grab */
setInterval(async () => {await retrieve()}, 5000)