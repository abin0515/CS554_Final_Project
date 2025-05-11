import { useState } from "react"
import AuthEmailPanel from "./AuthEmailPanel"

function EmailSignIn({ setModalOpen }) {
    const [hidden, setHidden] = useState(true)

    const openModal = () => {
        setHidden(false);
        setModalOpen(true);
    };

    const closeModal = () => {
        setHidden(true);
        setModalOpen(false);
    };

    return <>
        <button onClick={openModal}>Sign In With Email</button>
        {hidden ? <></> : <AuthEmailPanel setHidden={closeModal} />}
    </>
}

export default EmailSignIn 