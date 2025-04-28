
import { useState } from "react"
import { signUpNewAccount } from "../../lib/Auth"

import "./SignUpPanel.css"

function SignUpPanel(props){
    const [error, setError] = useState(false)

    return <div className="overlay">
        <button onClick={()=>{props.setHidden(true)}}>Close</button>
        <form className="container" id="signUpForm">
            <h2>Create A New Account</h2>
            

            <label htmlFor="email">Email</label>
            <input name="email" type="email"></input>

            <label htmlFor="password">Password</label>
            <input name="password" type="password"></input>

            <button onClick={async (e)=>{
                e.preventDefault()
                const form = document.getElementById("signUpForm")
                const fd = new FormData(form)


                const email = fd.get("email")
                const password = fd.get("password")

                try {
                    await signUpNewAccount(email, password)
                } catch (e) {
                    setError(e)
                }

            }}>Register</button>

            {error ? <p className="error">{error.message}</p> : <></>}
        </form>


    </div>
}

export default SignUpPanel

