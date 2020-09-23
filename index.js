const puppeteer = require('puppeteer');
const fileSystem = require('fs');

let scrape = async () => {
    const browser = await puppeteer.launch({headless: false});
    const pageBrowser = await browser.newPage();

    let allModelsInfo = [];
    let allModelRankInfo = [];

    for (let page = 200; page < 418; page++) {
        await pageBrowser.goto('https://www.modelhub.com/model/search?o=po&page=' + page);
        await pageBrowser.waitForTimeout(3000);

        let modelInfo = await pageBrowser.evaluate(() => {
            let homePageModelInfo = [];
            let modelList = document.querySelectorAll('.modelInfo .js-mixpanel');

            for (let model of modelList) {
                let username = model.childNodes[1].innerText;
                let url = model.href;
                let videoViews = model.childNodes[5].innerText;
                let numberOfVideos = model.childNodes[3].innerText;

                videoViews = videoViews.substring(0, videoViews.length - 6);
                numberOfVideos = numberOfVideos.substring(0, numberOfVideos.length - 7);

                homePageModelInfo.push({
                    username,
                    url,
                    videoViews,
                    numberOfVideos,
                });
            }
            return homePageModelInfo;
        });


        let urls = await pageBrowser.evaluate(() => Array.from(
            document.querySelectorAll('.modelInfo .js-mixpanel'
            ), element => element.href));

        f:for (let urlNumber = 0, total_urls = urls.length; urlNumber < total_urls; urlNumber++) {


            await pageBrowser.goto(urls[urlNumber]);

            await pageBrowser.waitForTimeout(800);

            let modelRank = await pageBrowser.evaluate(() => {
                    let individualPageModelInfo = [];
                    let scrapRank;
                    if (!document.querySelector('body > main > section.modelContent >' +
                        'div.infoSection > div.boxAround.subscribersInfo > p:nth-child(1)')) {
                        scrapRank = "notPage";
                    } else {

                        scrapRank = document.querySelector('body > main > section.modelContent >' +
                            'div.infoSection > div.boxAround.subscribersInfo > p:nth-child(1)')
                            .innerText;
                        scrapRank = scrapRank.substring(0, scrapRank.length - 14);
                    }
                    individualPageModelInfo.push({
                        scrapRank,
                    })
                return individualPageModelInfo;
                });
            allModelRankInfo = allModelRankInfo.concat(modelRank);
            await pageBrowser.goBack();
        }
        allModelsInfo =  allModelsInfo.concat(modelInfo);
    }
    allModelsInfo = JSON.stringify(allModelsInfo);
    allModelRankInfo = JSON.stringify(allModelRankInfo);

    await browser.close();
    return returnAllModelsInfo(allModelsInfo, allModelRankInfo);
};

scrape().then((value) => {
    generateCSV(value);
});

function returnAllModelsInfo(allModelsInfo, allModelRankInfo) {
    let allModelsInfoObject = JSON.parse(allModelsInfo);
    let allModelRankInfoObject = JSON.parse(allModelRankInfo);

    for (let i = 0; i < allModelsInfoObject.length; i++) {
        allModelsInfoObject[i].rank = allModelRankInfoObject[i].scrapRank;
    }

    return JSON.stringify(allModelsInfoObject, null, 4);
}

function generateCSV(modelInfoJson) {
        let models = {};
        const modelsInfo = JSON.parse(modelInfoJson);


            Object.values(modelsInfo).forEach(item => {
                models[item.url] = item;
            });


        const csv = [];
        const headers = {
            'username': 'Username',
            'url': 'Profile URL',
            'videoViews': 'Video Views',
            'numberOfVideos': 'Number of videos',
            'rank': 'Modelhub rank',
        };

        csv.push(Object.values(headers));

        Object.values(models).forEach(models => {
            const item = [];

            for (let attrName in headers) {
                let value = models[attrName];
                item.push(value);
            }
            csv.push(item);
        });



    const csvFileContent = csv.map(row => {
        return row.map(cell => {
            cell = (cell + '').replace(/"/gi, '&quot;');

            return `"${cell}"`;
        }).join(';');
    }).join('\n');

    fileSystem.writeFileSync('__result__4.csv', csvFileContent);
}

// 418  52; page < 100

