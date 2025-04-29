
import { useState } from "react"
import SignUpPanel from "./SignUpPanel"

function EmailSignUp() {
    const [hidden, setHidden] = useState(true)

    return <>
        <button onClick={()=>{setHidden(!hidden)}}>Create An Account With Email</button>

        {hidden ? <></>: <SignUpPanel setHidden={setHidden}/>}
    </>
}


export default EmailSignUp 
