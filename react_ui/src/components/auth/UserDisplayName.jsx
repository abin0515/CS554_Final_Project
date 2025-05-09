import React, { useState, useEffect } from 'react';
import { fetchUserDisplayName } from '../../lib/Auth';

const DisplayName = ({ userId, anonymity }) => {
    const [displayName, setDisplayName] = useState('User');

    useEffect(() => {
        if (anonymity) {
            setDisplayName('Anonymous');
            return;
        }
        let mounted = true;
        fetchUserDisplayName(userId).then(name => {
            if (mounted) {
                setDisplayName(name);
            }
        }).catch(error => {
            if (mounted) {
                setDisplayName('User');
            }
        });
        return () => (mounted = false);
    }, [userId, anonymity]);

    return <>{displayName}</>;
};

export default DisplayName;
