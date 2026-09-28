import React from 'react';
import { Button } from 'react-bootstrap';
import UserProfileModal from './UserProfileModal';

function UserProfileButton() {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <>
            <Button
                variant="outline-secondary"
                onClick={() => setShowModal(true)}
            >
                Profile
            </Button>

            <UserProfileModal
                show={showModal}
                onClose={() => setShowModal(false)}
            />
        </>
    );
}

export default UserProfileButton;