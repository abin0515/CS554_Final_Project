import { unauth } from "../../lib/Auth"

function SignOut() {

    const handleSignOutClick = async () => {
        // Display a confirmation dialog
        if (window.confirm("Are you sure you want to sign out?")) {
            try {
                await unauth(); // Call the original unauth function if confirmed
                console.log("User signed out successfully.");
                // Optionally navigate the user after logout
                // e.g., window.location.href = '/'; or useNavigate() hook
            } catch (error) {
                console.error("Error signing out:", error);
                // Optionally show an error message to the user
            }
        }
    };

    return <>
        {/* Use the new handler for the onClick event */}
        <button onClick={handleSignOutClick}>Sign Out</button>
    </>
}


export default SignOut 
