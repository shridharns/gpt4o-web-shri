import React, { useEffect, useState } from 'react';
import { Box, Avatar, CircularProgress, IconButton } from '@mui/material';
import { BubbleChart, Person, VolumeUp, Stop } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

const MessageList = ({ messages, loading, config, handleSpeak }) => {
    const [playingAudio, setPlayingAudio] = useState(null);
    const [currentMessage, setCurrentMessage] = useState(null);

    const handleStopAudio = () => {
        if (playingAudio) {
            playingAudio.pause();
            playingAudio.currentTime = 0;
            setPlayingAudio(null);
            setCurrentMessage(null);
        }
    };

    const handlePlayAudio = async (text, index) => {
        handleStopAudio();
        const audio = await handleSpeak(text);
        setPlayingAudio(audio);
        setCurrentMessage(index);
    };

    useEffect(() => {
        if (playingAudio) {
            playingAudio.addEventListener('ended', () => {
                setPlayingAudio(null);
                setCurrentMessage(null);
            });
            return () => {
                playingAudio.removeEventListener('ended', () => {
                    setPlayingAudio(null);
                    setCurrentMessage(null);
                });
            };
        }
    }, [playingAudio]);

    return (
        <Box>
            {messages.map((msg, index) => (
                <Box key={index} display="flex" justifyContent={msg.type === 'user' ? 'flex-end' : 'flex-start'} mb={1}>
                    {msg.type === 'bot' && (
                        <>
                            <Avatar
                                sx={{
                                    bgcolor: 'secondary.main',
                                    mr: 1,
                                    animation: currentMessage === index ? 'jump 0.5s infinite' : 'none',
                                }}
                            >
                                <BubbleChart />
                            </Avatar>
                            {config.speakingEnabled && (
                                <IconButton onClick={playingAudio ? handleStopAudio : () => handlePlayAudio(msg.text, index)}>
                                    {currentMessage === index && playingAudio ? <Stop sx={{ color: 'red' }} /> : <VolumeUp />}
                                </IconButton>
                            )}
                        </>
                    )}
                    <Box
                        sx={{
                            bgcolor: msg.type === 'user' ? 'primary.main' : 'grey.300',
                            color: msg.type === 'user' ? 'primary.contrastText' : 'black',
                            padding: '0px 10px',
                            borderRadius: 2,
                            maxWidth: '70%',
                            boxShadow: '0px 3px 6px rgba(0,0,0,0.1)',
                            wordWrap: 'break-word'
                        }}
                    >
                        <ReactMarkdown
                            children={msg.text}
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        />
                    </Box>
                    {msg.type === 'user' && <Avatar sx={{ bgcolor: 'primary.main', ml: 1 }}><Person /></Avatar>}
                </Box>
            ))}
            {loading && (
                <Box display="flex" justifyContent="flex-start">
                    <CircularProgress size={24} />
                </Box>
            )}
        </Box>
    );
};

export default MessageList;
