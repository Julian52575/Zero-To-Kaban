import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function BackButton() {
    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    };

    return (
        <Button
            variant="outline-secondary"
            onClick={goBack}
            aria-label="Go back"
        >
            <i className="fa fa-arrow-left me-2" />
            Back
        </Button>
    );
}

export default BackButton;