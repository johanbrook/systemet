# Is "Systembolaget" open?

This is a small app which responds "Yes" or "No" to the question above, which I've asked myself many, many times.

### Surf to [systemet.johanbrook.com](http://systemet.johanbrook.com) to visit the app live

In Sweden there's this alcohol monopoly, which means all liqour stores are run by the state. 
Thus there's no competition, and the opening hours are ... not that satisfactory. There's been days where I in panic
have looked for the closest open liqour store, just to find out that they closed fifteen minutes ago. 

**But no more.**

## Tech

I built this app partly to learn more about Node.js and MongoDB. It's been a ride. The Swedish "Systembolaget"'s 
public store API is in XML and badly formatted. Thus I decided to parse the XML daily and put it into a MongoDB
instance in order to get better experience querying for closest store, and more. And MongoDB is sexier than XML.

Stuff I've used

- Node.js
- Express.js
- MongoDB
- EJS
- CoffeeScript
- xml2js (XML to JSON)
- HTML5 GeoLocation
- A Gauss-Kruger conversion library (from RT90 coords to WSG)
- SCSS/Compass

Hosted on the Heroku Cedar stack with the MongoLab addon.

## Build

Be sure to install Node dependencies with

    npm install

before first run. The Gauss-Kruger conversion library is already bundled in this repo, as it's not on
NPM (yet).

In order to build the CoffeeScript files, just run

    cake build

If you want to watch and auto-compile, run

    cake watch

To run the import script which grabs the XML from Systembolaget.se, do

    cd build
    node script/import.js

It'll get the data from `http://www.systembolaget.se/Assortment.aspx?butikerombud=1`, parse it to JSON, and insert it
into a local MongoDB database (be sure to have it started).

Read more about Systembolaget's open APIs on 
[systembolaget.se/Tjanster/Oppna-APIer/](http://www.systembolaget.se/Tjanster/Oppna-APIer/)

The database details I use are

    host: localhost
    port: 27017
    dbname: systemet
    collection: stores

You'll find this in the code as well (`src/script/import.coffee`)