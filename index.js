/* Load the HTTP library */
const http = require("http");
const fetch = require('node-fetch')
const { client_id, client_secret, refreshToken } = require('./config.json')
const request = require('request')
const fs = require('fs')
async function grabToken(){
  let token = await fs.readFileSync('./token.txt', 'utf8')
  return token
}

/* Create an HTTP server to handle responses */
async function no(){
  try {
    let token = await grabToken()
    let options = await {
      method:"GET",
      headers:{Authorization:`Bearer    ${token}`}
    }
    const res = await fetch('http://api.spotify.com/v1/me/player/currently-playing', options);
    if(res.status == 401){
      refresh()
      return
    }
    else if(res.status == 204){
      return console.log("no song playing.")
    }else if (res.status == 200){
      const format = await res.json();
      if(format.is_playing == false){
        return console.log("no song playing")
      }
      if(format.currently_playing_type == 'ad'){
        return console.log("currently playing ad")
      }
      const songName = format.item.name
      const songLink = format.item.external_urls.spotify
      isAlbum = true;
      albumLink = format.context.external_urls.spotify;
      albumName = format.item.album.name;
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
        name:songName,
        link:songLink,
        isAlbum:isAlbum,
        albumLink:albumLink,
        albumName:albumName,
        progressFormatted:`${pMin}:${progress}`,
        progress:format.progress_ms,
        lengthFormatted:`${pLen}:${length}`,
        length:format.item.duration_ms,
        albumImage:format.item.album.images[0].url,
        prog:currentProg,
        endTimestamp:`${Math.round((Date.now() / 1000)+currentProg)}`
      }
      return console.log(current)
      
      
    }else{
      console.log(res)
    }
  } catch (err) {
    console.error(err.message);
  }
}
async function grab(){
  const bruh  = await no()
  return bruh
}
async function refresh(){
  var authOptions = {
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
    }
  });
}

setInterval(() => {grab()}, 5000)
