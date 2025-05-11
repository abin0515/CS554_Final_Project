import { useState } from "react";
import { sendResetEmail, checkUserEmailExists } from "../../lib/Auth";
import "./AuthEmailPanel.css";

function ForgotPasswordPanel({ setHidden, onBack }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const exists = await checkUserEmailExists(email);
      if (!exists) {
        setError("No account found with this email.");
        setLoading(false);
        return;
      }
      await sendResetEmail(email);
      setMessage("If this email is registered, a reset link will be sent.");
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-overlay">
      <div className="signin-panel-container">
        <button className="signin-close-button" onClick={() => setHidden(true)}>
          ×
        </button>
        <form className="signin-form" onSubmit={handleSend}>
          <h2 className="signin-panel-title">Forgot Password</h2>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button className="signin-submit-button" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <button
            type="button"
            className="signin-forgot-password-button"
            onClick={onBack}
            disabled={loading}
          >
            Back to Sign In
          </button>
          {error && <p className="signin-error">{error}</p>}
          {message && <p className="signin-success">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPanel; 