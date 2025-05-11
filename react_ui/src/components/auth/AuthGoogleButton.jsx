import { authGoogle } from "../../lib/Auth"

function GoogleSignIn() {
    return <>
        <button onClick={authGoogle}>Sign In With Google</button>
    </>
}


export default GoogleSignIn 