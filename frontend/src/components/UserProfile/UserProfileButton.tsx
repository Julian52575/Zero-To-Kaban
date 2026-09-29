import React from 'react';
import { Button } from 'react-bootstrap';
import UserProfileModal from './UserProfileModal';

function UserProfileButton() {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <>
            <style>{`
                .user-profile-button {
                    margin-left: auto;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #fff;
                    background-color: #198754;
                    border: none;
                    margin : 5px;
                }

                .user-profile-button:hover {
                    background-color: #146c43;
                    transform: scale(1.02);
                    transition: transform 0.2s ease-in-out;
                }
            `}</style>

            <Button
                className="user-profile-button"
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
