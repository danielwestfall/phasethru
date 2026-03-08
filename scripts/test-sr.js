const YouTube = require('youtube-sr').default;

async function test() {
    const results = await YouTube.search("LOH1l-MP_9k", { limit: 2 });
    console.log(JSON.stringify(results, null, 2));
}

test();
