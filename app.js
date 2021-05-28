const googleSearch = require('ggis');
const imgDownloader = require('imgdownloader');
const imgLookAlike = require('imglookalike');
const fs = require('fs');
const path = require('path');
const Twitter = require('twitter');

// get environement variable with dotenv
require('dotenv').config()

let shrekMemes = new googleSearch(process.env.GOOGLE_CSE, process.env.GOOGLE_API_KEY); //create a new google search class
let client = new imgDownloader(process.env.SAVE_FOLDER); // create a new imgdownloader class
let twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

let images = fs.readdirSync(process.env.SAVE_FOLDER); // get all the files that are in the save folder




async function tryPost() {

    let isPostable = true;
    let nTries = 0;
    //let memesUrls;
    let downloadedImage;

    //search for shrek dank memes images
    
    try {
        memesUrls = await shrekMemes.search("shrek memes", {nPages : 10});
    } catch (error) {
        throw error;
    }
   
    do {
        console.log("try number :" + nTries);
        //download a random image from the memesUrls 
        try {
            downloadedImage = await client.download(memesUrls[Math.floor(Math.random() * memesUrls.length)].url, 'image2')
        } catch (error) {
            throw error;
        }

        
        //if there are images in the save folder
        if (images.length > 0) {

            // check against every other file with imglookalike and nbits 32 and use the hamming algo
            let distance;
            console.log('the number of images is ' + images.length)
            for (let i = 0; i < images.length; i++) {
                console.log('checking against image ' + images[i]);
                try{
                    distance = await imgLookAlike.compare(downloadedImage, path.resolve(__dirname, process.env.SAVE_FOLDER, images[i]), {algorithm: "hamming", nBits: 16});
                    console.log("the distance between those image is : " + distance);
                    if(distance < 10){
                        isPostable = false;
                        fs.unlinkSync(downloadedImage);
                        break;
                    }else{
                        isPostable = true;
                    }
                }catch(error){
                    throw error;
                }
            }
        }

        nTries++;
    } while (!isPostable && nTries < 10)

    if(isPostable){
        console.log("Found a suitable image to post : " + downloadedImage);

        let imageData = fs.readFileSync(downloadedImage);

        twitterClient.post('media/upload', {media: imageData}, function(error, media, response) {

            if (!error) {
          
              // If successful, a media object will be returned.
              console.log(media);
          
              // Lets tweet it
              var status = {
                status: 'shrek is love, shrek is life',
                media_ids: media.media_id_string // Pass the media id string
              }
          
              twitterClient.post('statuses/update', status, function(error, tweet, response) {
                if (!error) {
                  console.log(tweet);
                }else{
                    console.log(error);
                }
              });
          
            }
            else{
                console.log(error)
            }
          });
    }else{
        console.log("Sorry but no suitable image was found");
    }
}

tryPost()
.catch((e) => {
    console.log(e);
})