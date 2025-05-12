import { useState } from "react";
import { createPortal } from "react-dom";
import { authEmail } from "../../lib/Auth";
import ForgotPasswordPanel from "./ForgotPasswordPanel";
import "./AuthEmailPanel.css";

function AuthEmailPanel(props) {
  const [error, setError] = useState(null);
  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) {
    return createPortal(
      <ForgotPasswordPanel setHidden={props.setHidden} onBack={() => setShowForgot(false)} />,
      document.body
    );
  }

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return typeof email === 'string' && re.test(email.trim());
  };
  

  const validatePassword = (password) => {
    return typeof password === 'string' && password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const form = document.getElementById("signInForm");
    const fd = new FormData(form);
    const email = fd.get("email").trim();
    const password = fd.get("password");

    // Input validation
    if (!email || !validateEmail(email)) {
      setError({ message: "Please enter a valid email address." });
      return;
    }
    if (!validatePassword(password)) {
      setError({ message: "Password must be at least 6 characters long." });
      return;
    }

    try {
      await authEmail(email, password);
    } catch (e) {
      setError({ message: e.message || "Authentication failed." });
    }
  };

  const modal = (
    <div className="signin-overlay">
      <div className="signin-panel-container" style={{ pointerEvents: "auto", zIndex: 10000 }} onClick={(e) => e.stopPropagation()}>
        <button className="signin-close-button" onClick={() => props.setHidden(true)}>×</button>
        <form className="signin-form" id="signInForm">
          <h2 className="signin-panel-title">Sign In With Email</h2>

          <label htmlFor="email">Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label htmlFor="password">Password</label>
          <input name="password" type="password" placeholder="Enter your password" required />

          <button className="signin-submit-button" onClick={handleSubmit}>
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
