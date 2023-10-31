// import puppeteer from 'puppeteer';
// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
import puppeteer from 'puppeteer-extra';

// add stealth plugin and use defaults (all evasion techniques)
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin())
// import puppeteer from 'puppeteer-extra';

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// puppeteer.use(StealthPlugin());
// Add adblocker plugin to block all ads and trackers (saves bandwidth)
// import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

import { executablePath } from 'puppeteer';

const myBrowser = {
	async start( proxyServer ) {
		let browser;
		try {
	    	// console.log("Opening the browser......");
	    	browser = await puppeteer.launch({
	        	headless: 'new', // 'new',
				// executablePath: executablePath,
                // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
	        	// ignoreDefaultArgs: true, // needed ?
				devtools: false, // not needed so far, we can see websocket frames and xhr responses without that.
				//dumpio: true,
				//defaultViewport: { //--window-size in args
  				//	width: 1280,
  				//	height: 882
				//},
				args: [
					'--proxy-server=' + proxyServer,
                    '--disable-dev-shm-usage',
					'--lang=en-CM,en',
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
					'--disable-accelerated-2d-canvas',
					'--no-first-run',
					'--no-zygote',
					'--disable-gpu',
					// '--start-fullscreen',
					// '--incognito',
				] 
	    	});
		} catch (err) {
	    	console.log("Could not create a browser instance => : ", err);
		}
		return browser;
	}
}

export { myBrowser };