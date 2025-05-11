import { useState } from "react";
import { createPortal } from "react-dom";
import { authEmail } from "../../lib/Auth";
import ForgotPasswordPanel from "./ForgotPasswordPanel";
import "./AuthEmailPanel.css";

function AuthEmailPanel(props) {
  const [error, setError] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) {
    return createPortal(
      <ForgotPasswordPanel setHidden={props.setHidden} onBack={() => setShowForgot(false)} />,
      document.body
    );
  }

  const modal = (
    <div className="signin-overlay">
      <div
        className="signin-panel-container"
        style={{ pointerEvents: "auto", border: "3px solid red", zIndex: 10000 }}
        onClick={(e) => { console.log('Panel click'); e.stopPropagation(); }}
      >
        <button className="signin-close-button" onClick={() => props.setHidden(true)}>
          ×
        </button>
        <form
          className="signin-form"
          id="signInForm"
          onClick={() => { console.log('Form click'); }}
        >
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

          <button
            type="button"
            className="signin-forgot-password-button"
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </button>

          {error && <p className="signin-error">{error.message}</p>}
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body); 
}

export default AuthEmailPanel;
