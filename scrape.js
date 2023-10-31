// WARNING: don't use console.error here for debug, use console.error instead. STDOUT is used to deliver output data

import { myBrowser } from "./browser.js";
import { proxy } from './proxy.js';
const proxyIP 	= proxy.ip; 		// '185.199.229.156';
const proxyPort = proxy.port;		// '7492';
const user	 	= proxy.user;		// 'mgruzqyb';
const password 	= proxy.password;	// 'x9pn5k6ibn7k';
const proxyServer = 'http://' + proxyIP + ':' + proxyPort;

// find value of input process argument with --input-data
const inpDataB64 = process.argv.find((a) => a.startsWith('--input-data')).replace('--input-data', '');
const inputData = await JSON.parse(Buffer.from(inpDataB64, 'base64').toString());

// Posted data validations
const link = inputData.link;
//if( !link ){ 		// no end date
//	const  message = 'Mettez le lien de l\'hotel svp';
//console.error( message );
//	await endNotAvailable( message )
//}

console.error( '' );
console.error( '***' );
console.error( '' );
console.error( 'Link: ' + link );

// start a browser
var outputData  = '';
var browser = '';
const startAPage = async() =>{
	browser = await myBrowser.start( proxyServer );
	// start a page
	const page = await browser.newPage();

	// await page.setExtraHTTPHeaders({
	// 	'Proxy-Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64'),
	// });
	
	await page.authenticate({username:user, password:password});

	await page.setRequestInterception(true)
	await page.on('request', (req) => {
		if (
			req.resourceType() === 'image'
		){
			req.abort();
		}
		else {
    		req.continue();
		}
	});
	
	// set page's browser client
	const agents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36" ,"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"];

	const randomAgents = agents[Math.floor(Math.random() * agents.length)];
	await page.setUserAgent(randomAgents);

	await page.setViewport({
		width: 1366,
		height: 768,
		//deviceScaleFactor: 1,
		//hasTouch: false,
		isLandscape: true,
		//isMobile: false,
	});
	return page;
}


// get the less expensive room data
const getCheapestRoomData = async( page ) => {
	// get prices
    const pricesX 		= "//span[ contains( @aria-hidden, 'true' ) ]/div[ contains( ., '€' ) ]";
	const pricesElt  	= await page.$x( pricesX ); 
	// compare prices and get the minilum price
	var prev_price 	= 0;
	var min_price	= '';	// 150 €
	var min_amount	= '';	// 150
	var indice 		= 0;
	var dispo 		= 1;
	for( var price of pricesElt ){
		var price = await page.evaluate(elt => elt.textContent, pricesElt[ indice ]);
		// cleaning
		const amount = price.replace( '€', '' ).trim();
		// comparing
		if( !indice ){					// for the first price				
			min_amount = amount;
			min_price  = price;
		}
		else if ( +amount < +min_amount ){	// for the other prices
			min_amount = amount;
			min_price  = price;			
		}
console.error( 'price: ' + price );
console.error( 'min_price: ' + min_price );
		indice ++;
	}

    // quantite ( nombre de nuits )
    const quantiteX = "//span[ contains( @aria-hidden, 'true' ) ]/div[ contains( ., '" + min_price + "' ) ]//ancestor::div[2]/following-sibling::div";
    var quantite = '';
    try {
        await page.waitForXPath( quantiteX, {timeout:18000} );
        const elts = await page.$x(quantiteX);
        quantite = await page.evaluate(elt => elt.textContent, elts[0]);
    }
    catch (err) {
        console.error('quantite error: ' + err.message );
    }
	
    // Unit price ( prix d'une nuit )
    const unitX = "//span[ contains( @aria-hidden, 'true' ) ]/div[ contains( ., '" + min_price + "' ) ]//ancestor::div[2]/following-sibling::div/following-sibling::div";
    var unit = '';
    try {
        await page.waitForXPath( unitX, {timeout:18000} );
        const elts = await page.$x(unitX);
        unit = await page.evaluate(elt => elt.textContent, elts[0]);
    }
    catch (err) {
        console.error('unit error: ' + err.message );
    }
	
	// detail ( taxes )
    const detailX = "//span[ contains( @aria-hidden, 'true' ) ]/div[ contains( ., '" + min_price + "' ) ]//ancestor::div[2]/following-sibling::div/following-sibling::div/following-sibling::div";
    var detail = '';
    try {
        await page.waitForXPath( detailX, {timeout:18000} );
        const elts = await page.$x(detailX);
        detail = await page.evaluate(elt => elt.textContent, elts[0]);
    }
    catch (err) {
        console.error('detail error: ' + err.message );
    }
	
	// return
	if( min_price == '' || quantite == '' || unit  == '' || detail  == '' ){
		dispo  = 0;
		detail = 'Details de la chambre non trouvés';
	}
	
	const obj = {};
	obj.Disponibilite	= dispo;
	obj.Prix 		= min_price;
	obj.Quantite 	= quantite;
	obj.Unitaire 	= unit;
	obj.Detail 		= detail;
	obj.Link 		= link;
	
	return obj;
}

// Open the link
const page = await startAPage();
await page.goto( link, { timeout: 0 } ); 

// Check if available
const errorDivX = "//div[ contains( @data-stid, 'error-messages' ) ]";

console.error( 'Searching available rooms' );

try{ // check if error div exists
	await page.waitForXPath( errorDivX );
	const elts = await page.$x( errorDivX );  // get the new value
	const message = await page.evaluate( elt => elt.textContent, elts[0]);  // Aucune disponibilité sur notre site

console.error( 'Error message: ' + message );
	// return
	const obj = {};
	obj.Disponibilite	= 0;
	obj.Detail 			= message;
	
	await page.close();
	await browser.close();

	console.log( JSON.stringify( obj ) )  // print out data to STDOUT
}
catch( err ){	
// console.error( 'err.message: ' + err.message );
}
	
// get the cheapest room's data
const roomData = await getCheapestRoomData( page );

console.error( roomData );

await page.close();
await browser.close();

console.log( JSON.stringify( roomData ) )  // print out data to STDOUT
