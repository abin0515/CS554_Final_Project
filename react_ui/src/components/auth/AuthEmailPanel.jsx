import { useState } from "react";
import { createPortal } from "react-dom";
import { authEmail } from "../../lib/Auth";
import "./AuthEmailPanel.css";

function AuthEmailPanel(props) {
  const [error, setError] = useState(false);

  const modal = (
    <div className="signin-overlay">
      <div className="signin-panel-container">
        <button className="signin-close-button" onClick={() => props.setHidden(true)}>
          ×
        </button>
        <form className="signin-form" id="signInForm">
          <h2 className="signin-panel-title">Sign In With Email</h2>

          <label htmlFor="email">Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label htmlFor="password">Password</label>
          <input name="password" type="password" placeholder="Enter your password" required />

          <button
            className="signin-submit-button"
            onClick={async (e) => {
              e.preventDefault();
              const form = document.getElementById("signInForm");
              const fd = new FormData(form);

              const email = fd.get("email");
              const password = fd.get("password");

              try {
                await authEmail(email, password);
              } catch (e) {
                setError(e);
              }
            }}
          >
            Sign In
          </button>

          {error && <p className="signin-error">{error.message}</p>}
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body); 
}

export default AuthEmailPanel;
