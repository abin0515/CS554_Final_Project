import { useState } from "react";

import BestPosts from "./BestPosts";
import LoudestPosts from "./LoudestPosts";
import TrendingPosts from "./TrendingPosts";

const rotary_queue = [
    {name:"Trending Posts", comp:<TrendingPosts/>},
    {name:"Best Posts", comp:<BestPosts/>},
    {name:"Loudest Posts", comp:<LoudestPosts/>}
]

function Reccomendations(){
    const [index, setIndex] = useState(0);
    const rotate_nxt = () => setIndex((index+1)%rotary_queue.length)
    const rotate_prv = () => setIndex((index-1+rotary_queue.length)%rotary_queue.length)

    return (<div>
        <span id="reccomendations-header">
            <button onClick={rotate_prv}>{"<"}</button>
            <h4>{rotary_queue[index].name}</h4>
            <button onClick={rotate_nxt}>{">"}</button>
        </span>

        {rotary_queue[index].comp}
    </div>)

}

export default Reccomendations
