import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from "fs";
import request from 'request';
import util from 'util';
import path from 'path';



// Child process
const __dirname = path.resolve();
async function runPupeteer(data) {
    const jsonData = JSON.stringify(data)
    const b64Data = Buffer.from(jsonData).toString('base64');
    let stdoutData = '';
    return await new Promise((resolve) => {
        const proc = spawn('node', [
            path.resolve(__dirname, data.puWorker),
            `--input-data${b64Data}`,
            '--tagprocess'
        ], { shell: false });
        proc.stdout.on('data', (data) => {
            stdoutData += data;
        });
        proc.stderr.on('data', (data) => {
            console.error(`NodeERR: ${data}`);
        });
        proc.on('close', async (code) => {
        });
        proc.on('exit', function (){
            proc.kill();
            resolve(JSON.parse(stdoutData));
        });
    });
}

// App and CORS
const app = express();
var corsOptions = {
	origin: [ 'http://localhost', 'https://nieca.cm', ],
	// optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use( cors( corsOptions ) );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.timeout = 300000;
const port = 8082;
var link = '';

// Main function
app.post( '/', async( req, res ) => {
	
	// Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'https://nieca.cm');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

	await  res.append( 'Content-Type', 'application/json' );
	// scrape
	link = req.body.link;
	const puWorkerItem = 'scrape.js';
	const puDataItem = {
		puWorker: puWorkerItem,  // puppeteer actions file
		link: link,
	}

	const response = await runPupeteer( puDataItem );
// console.log( response );
	return res.send( response );


})

// listening to server port
app.listen( port, () => {
	console.log( `Express server is listening on port ${port}` )
})



console.log( '' );
console.log( '>>>' );
console.log( 'The server is ready!' );
