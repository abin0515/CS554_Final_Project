
import { useState } from "react"
import { authEmail } from "../../lib/Auth"

import "./AuthEmailPanel.css"

function AuthEmailPanel(props){
    const [error, setError] = useState(false)

    return <div className="overlay">
        <button onClick={()=>{props.setHidden(true)}}>Close</button>
        <form className="container" id="signInForm">
            <h2>Sign In With Email</h2>
            

            <label htmlFor="email">Email</label>
            <input name="email" type="email"></input>

            <label htmlFor="password">Password</label>
            <input name="password" type="password"></input>

            <button onClick={async (e)=>{
                e.preventDefault()
                const form = document.getElementById("signInForm")
                const fd = new FormData(form)


                const email = fd.get("email")
                const password = fd.get("password")

                try {
                    await authEmail(email, password)
                } catch (e) {
                    setError(e)
                }

            }}>Sign In</button>

            {error ? <p className="error">{error.message}</p> : <></>}
        </form>


    </div>
}

export default AuthEmailPanel

