import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function BackButton() {
    const navigate = useNavigate();

    const goBack = () => {
        void navigate(-1);
    };

    return (
        <>
            <style>{`
                .back-button {
                    margin-left: auto;
                    border-radius: 8px;
                    font-weight: 600;
                    color: #fff;
                    background-color: #198754;
                    border: none;
                    margin: 5px;
                }

                .back-button:hover {
                    background-color: #146c43;
                    transform: scale(1.02);
                    transition: transform 0.2s ease-in-out;
                }
            `}</style>
            <Button
                variant="outline-secondary"
                onClick={goBack}
                aria-label="Go back"
                className="back-button"
            >
                <i className="fa fa-arrow-left me-2" />
                Back
            </Button>
        </>
    );
}

export default BackButton;