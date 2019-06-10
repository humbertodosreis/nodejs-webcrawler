/*
# Docker
https://www.digitalocean.com/community/tutorials/containerizing-a-node-js-application-for-development-with-docker-compose
https://dev.to/alex_barashkov/using-docker-for-nodejs-in-development-and-production-3cgp
https://blog.codeship.com/using-docker-compose-for-nodejs-development/
https://hackernoon.com/a-better-way-to-develop-node-js-with-docker-cd29d3a0093
https://scotch.io/tutorials/docker-and-visual-studio-code
https://www.freecodecamp.org/news/the-ultimate-guide-to-web-scraping-with-node-js-daa2027dcd3/

#Recursos
https://pptr.dev/
https://github.com/emadehsan/thal
https://github.com/checkly/puppeteer-examples#github
https://github.com/GoogleChrome/puppeteer/blob/master/examples/search.js
https://medium.com/jmosawy/a-simple-node-js-crawler-to-download-ldoces-pronunciations-3c6ce81841c8

#Tutoriais
https://hackernoon.com/tips-and-tricks-for-web-scraping-with-puppeteer-ed391a63d952
https://medium.com/@e_mad_ehsan/getting-started-with-puppeteer-and-chrome-headless-for-web-scrapping-6bf5979dee3e
* https://learnscraping.com/nodejs-web-scraping-with-puppeteer/

#Download
https://www.bountysource.com/issues/48332987-question-how-do-i-get-puppeteer-to-download-a-file
https://kb.apify.com/storing-and-accessing-data/handling-file-download-with-puppeteer
https://docs.browserless.io/docs/downloading-files.html
https://stackoverflow.com/questions/49245080/how-to-download-file-with-puppeteer-using-headless-true

*/
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const request = require('request');
const url = require('url');

const BASE_URL = 'https://vip.mairovergara.com';
const SIGNIN_URL = `${BASE_URL}/entry/signin`;
const LIVE_LESSONS_URL = `${BASE_URL}/discussion/813/oficial-lista-completa-de-live-lessons`;

const USER = 'user@mail.com';
const PASSWORD = '123456;

const downloadPath = path.resolve(__dirname, 'downloads/');

function normalize(word) {
    return word.trim().replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_+/g, '')
        .replace(/_+$/g, '')
        .toLowerCase();
}

function download(dir, link) {
    const urlParts = url.parse(link);
    const filename = urlParts.pathname.split('/').slice(-1)[0];

    let req = request
        .get(link)
        .on('error', err => {
            return err;
        })
        .on('response', res => {
            if (res.statusCode == 200)
                req.pipe(fs.createWriteStream(path.resolve(dir, filename)));
        });
}

function createDownloadDir(dir) {
    const filePath = path.resolve(downloadPath, dir);

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath);
    }

    return filePath;
}

(async () => {
    /* initialize browser */
    const browser = await puppeteer.launch({
        //headless: false,
        executablePath: '/usr/bin/chromium-browser',
        args: [
            // Required for Docker version of Puppeteer
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // This will write shared memory files into /tmp instead of /dev/shm,
            // because Docker’s default for /dev/shm is 64MB
            '--disable-dev-shm-usage'
        ]
    });

    browser.on('targetcreated', async (target) => {
        let s = target.url();
    //    console.log(target);
        //the test opens an about:blank to start - ignore this
        if (s == 'about:blank') {
            return;
        }

        console.log(s);

        //unencode the characters after removing the content type
        //s = s.replace("data:text/csv;charset=utf-8,", "");
        //clean up string by unencoding the %xx
        
        fs.writeFile("/tmp/download.csv", s, function(err) {
            if(err) {
                console.log(err);
                return;
            }
            console.log("The file was saved!");
        });
    });

    const browserVersion = await browser.version();

    const page = await browser.newPage();

    try {
        await page.goto(SIGNIN_URL);

        await page.type('#Form_Email', USER);
        await page.type('#Form_Password', PASSWORD);
        await page.click('#Form_SignIn');
        await page.waitForNavigation();

        console.log('Go to page ' + LIVE_LESSONS_URL);

        await page.goto(LIVE_LESSONS_URL);

        let links = await page.evaluate(() => {
            const anchors = Array
                .from(document.querySelectorAll('#Content .Comment > .Message > .bbcode_url'))
                .map(anchor => {
                    return {
                        href: anchor.href,
                        title: anchor.innerHTML
                    };
                });

            return anchors;
        });

        for (let i = 0; i < links.length; i++) {
            let link = links[i];

            if (link.href.indexOf('magic-stories') == -1 && link.href.indexOf('grammar-vocab') == -1) {
                continue;
            }

            const pageTitle = normalize(link.title);

            await page.goto(link.href);

            /*let materials = */await page.evaluate(() => {
                document.querySelectorAll('#Content .FirstComment > .Comment > .Attachments .Attachment a').forEach(
                    element => element.click()
                );
                
                //let attachments = Array.from(document.querySelectorAll('#Content .FirstComment > .Comment > .Attachments .Attachment a'));

                //let video = document.querySelector('#Content .FirstComment iframe').src;

                /*
                return {
                    video,
                    attachments
                };
                */
            });

            //console.log(materials);

            // salvar os arquivos
            //console.log('Creating dir ' + pageTitle);

            //const downloadsDirPath = createDownloadDir(pageTitle);

            //let attachments = materials.attachments;

            //console.log(attachments);

            //for (let j = 0; j < attachments.length; j++) {
              //  console.log('Downloading ' + attachments[j].href);
                
                /*await Promise.all([
                    page.click(attachments[j]),
                   // Event on all responses
                    page.on('response', response => {
                        // If response has a file on it
                        if (response._headers['content-disposition'] === `attachment;filename=${filename}`) {
                           // Get the size
                            console.log('Size del header: ', response._headers['content-length']);
                            // Watch event on download folder or file
                             /*fs.watchFile(dir, function (curr, prev) {
                               // If current size eq to size from response then close
                                if (parseInt(curr.size) === parseInt(response._headers['content-length'])) {
                                    browser.close();
                                    this.close();
                                }
                            });*
                        }
                    })
                ]);

                //download(downloadsDirPath, attachments[j]);
                */
          //  }
        }
    } catch (error) {
        console.log(error);
    }

    await browser.close();
})();
