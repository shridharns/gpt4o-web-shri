// src/WelcomePage.js
import React from 'react';
import { Box, Typography, Button, Card, CardContent, CardActions, CardMedia } from '@mui/material';
import styled from '@emotion/styled';

const assistantImage = `${process.env.PUBLIC_URL}/images/bot.png`;

const Root = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(to right, #3a7bd5, #00d2ff)',
    textAlign: 'center',
    padding: '16px',
});

const StyledCard = styled(Card)({
    maxWidth: 800,
    margin: '16px',
    padding: '16px',
    boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
    borderRadius: 16,
    backgroundColor: '#ffffff',
});

const Media = styled(CardMedia)({
    margin: '16px 0 0 0',
    height: 300,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    borderRadius: 16,
});

const StyledButton = styled(Button)({
    margin: '5px',
    padding: '1px 44px',
    fontSize: '2rem',
    textTransform: 'none',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
    transition: 'background-color 0.3s, transform 0.3s',
    '&:hover': {
        backgroundColor: '#0056b3',
        transform: 'scale(1.05)',
    },
});

const CenteredCardActions = styled(CardActions)({
    display: 'flex',
    justifyContent: 'center',
});

const Welcome = ({ onStart }) => {
    return (
        <Root>
            <StyledCard>
                <Media
                    image={assistantImage}
                    title="Personal Assistant Bot"
                />
                <CardContent>
                    <Typography variant="h3" gutterBottom color="darkslateblue">
                        Introducing Your Personal AI Assistant
                    </Typography>
                    <Typography variant="body1" paragraph>
                        Our Personal AI assistant understands multimodal input and can interact with you in real-time through text, voice, video, and images. Get help on everything, including the most complex math problems!
                    </Typography>
                </CardContent>
                <CenteredCardActions>
                    <StyledButton
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={onStart}
                    >
                        Get Started
                    </StyledButton>
                </CenteredCardActions>
            </StyledCard>
        </Root>
    );
};

export default Welcome;
