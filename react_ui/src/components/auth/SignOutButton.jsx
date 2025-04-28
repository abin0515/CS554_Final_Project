import { unauth } from "../../lib/Auth"

function SignOut() {
    return <>
        <button onClick={unauth}>Sign Out</button>
    </>
}


export default SignOut 
