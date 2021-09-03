import React, { useState } from 'react';
import YouTube from 'react-youtube';
import Button from "@material-ui/core/Button";

const video = () => {
    const [player, setPlayer] = useState(null);
    const onReady = (event) => {
		console.log(`YouTube Player has been saved to state.`);
		setPlayer(event.target);
	};
    return (
        <div>
            <YouTube
            videoId={"mTz0GXj8NN0"}
            onReady={onReady}
            />
            <div>
            <Button variant="contained" color="primary" onClick={() => { player.playVideo()}}>
          Hello World
        </Button>
            </div>
        </div>
    )
}

export default video
