import { useState } from "react";
import { signUpNewAccount } from "../../lib/Auth";
import "./SignUpPanel.css";

function SignUpPanel(props) {
  const [error, setError] = useState("");

  const isValidEmail = (email) =>/^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  const isValidDisplayName = (name) =>
    /^[a-zA-Z\s]{2,30}$/.test(name.trim());

  const isStrongPassword = (password) =>
    typeof password === "string" && password.length >= 6;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const form = document.getElementById("signUpForm");
    const fd = new FormData(form);
    const email = fd.get("email");
    const password = fd.get("password");
    const displayName = fd.get("displayName");

    // Client-side validation
    if (!displayName || !isValidDisplayName(displayName)) {
      return setError("Please enter a valid name (letters only, 2–30 characters).");
    }

    if (!email || !isValidEmail(email)) {
      return setError("Please enter a valid email address.");
    }

    if (!password || !isStrongPassword(password)) {
      return setError("Password must be at least 6 characters long.");
    }

    try {
      await signUpNewAccount(email, password, displayName);
    } catch (e) {
      setError(e.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="overlay">
      <div className="panel-container">
        <button className="close-button" onClick={() => props.setHidden(true)}>×</button>
        <form className="email-panel-form" id="signUpForm">
          <h2 className="panel-title">Create Account</h2>

          <label htmlFor="displayName">Display Name</label>
          <input name="displayName" type="text" placeholder="Your name" required />

          <label htmlFor="email">Email</label>
          <input name="email" type="email" placeholder="Enter your email" required />

          <label htmlFor="password">Password</label>
          <input name="password" type="password" placeholder="Enter your password" required />

          <button className="submit-button" onClick={handleRegister}>
            Register
          </button>

          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default SignUpPanel;
