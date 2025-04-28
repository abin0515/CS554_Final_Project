import GoogleSignIn from './auth/AuthGoogleButton';
import EmailSignIn from './auth/AuthEmailButton';
import SignOut from './auth/SignOutButton';
import EmailSignUp from './auth/SignUpButton';
import { useAuth } from '../lib/Auth';

import "./HeaderBar.css"


function HeaderBar(){
    const authState = useAuth();

    return <div className="app-header">
        {authState.user ? 
          <> {/* If the user is logged in, say hello and render a logout button */}
            Hello {authState.user.displayName ? authState.user.displayName : authState.user.email}
            <span className='authControls'>
                <SignOut/>
            </span>
          </>: 
          <> {/* If the user is not logged in, render the login options */} 
            You Are Not Signed In
            <span className='authControls'>
                <GoogleSignIn/>
                <EmailSignIn/>
                <EmailSignUp/>
            </span>
          </>
        }
      </div>
}

export default HeaderBar