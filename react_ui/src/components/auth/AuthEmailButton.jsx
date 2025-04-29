import { useState } from "react"
import AuthEmailPanel from "./AuthEmailPanel"

function EmailSignIn() {
    const [hidden, setHidden] = useState(true)

    return <>
        <button onClick={()=>{setHidden(!hidden)}}>Sign In With Email</button>

        {hidden ? <></>: <AuthEmailPanel setHidden={setHidden}/>}
    </>
}


export default EmailSignIn 
