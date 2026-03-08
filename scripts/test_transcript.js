const { YoutubeTranscript } = require('@playzone/youtube-transcript');

async function testFetch() {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript('mTz0GXj8NN0'); // Next.js crash course
        console.log("Success! Fetched " + transcript.length + " caption lines.");
        console.log("Sample:", transcript[0]);
    } catch (e) {
        console.error("Failed to fetch transcript:", e.message);
    }
}

testFetch();
