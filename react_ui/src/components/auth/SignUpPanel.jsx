import { useState } from "react";
import { signUpNewAccount } from "../../lib/Auth";
import "./SignUpPanel.css";

function SignUpPanel(props) {
  const [error, setError] = useState(false);

  return (
    <div className="overlay">
      <div className="panel-container">
        <button className="close-button" onClick={() => props.setHidden(true)}>×</button>
        <form className="email-panel-form" id="signUpForm">
          <h2 className="panel-title">Create Account</h2>

          <label htmlFor="email">Email</label>
          <input name="email" type="email" placeholder="Enter your email" />

          <label htmlFor="password">Password</label>
          <input name="password" type="password" placeholder="Enter your password" />

          <button
            className="submit-button"
            onClick={async (e) => {
              e.preventDefault();
              const form = document.getElementById("signUpForm");
              const fd = new FormData(form);
              const email = fd.get("email");
              const password = fd.get("password");

              try {
                await signUpNewAccount(email, password);
              } catch (e) {
                setError(e);
              }
            }}
          >
            Register
          </button>

          {error && <p className="error">{error.message}</p>}
        </form>
      </div>
    </div>
  );
}

export default SignUpPanel;
