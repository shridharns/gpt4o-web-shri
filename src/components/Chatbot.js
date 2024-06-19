import React, { useState, useEffect, useRef } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Box, CircularProgress, useMediaQuery, Paper, Fab
} from '@mui/material';
import { Close, Settings, Fullscreen, FullscreenExit, ArrowDownward } from '@mui/icons-material';
import io from 'socket.io-client';
import Draggable from 'react-draggable';
import MessageList from './MessageList';
import InputArea from './InputArea';
import StreamControls from './StreamControls';
import StreamDisplay from './StreamDisplay';
import ConfigDialog from './ConfigDialog';
import axios from 'axios';
import '../bot.css';

const socket = io('http://localhost:4000');

const PaperComponent = (props) => {
    return (
        <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
};

const Chatbot = ({ open, handleClose }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([{ type: 'bot', text: 'Welcome! How can I assist you today?' }]);
    const [screenStream, setScreenStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [microphoneStream, setMicrophoneStream] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [configOpen, setConfigOpen] = useState(false);
    const [config, setConfig] = useState({ speakingEnabled: false, conversationStyle: 'default', continuousReading: false, voice: 'female' });
    const [maximized, setMaximized] = useState(true);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);

    const screenVideoRef = useRef(null);
    const cameraVideoRef = useRef(null);
    const microphoneAudioRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const canvasRef = useRef(null);

    const isSmallScreen = useMediaQuery('(max-width:600px)');
    const settingsButtonRef = useRef(null);

    useEffect(() => {
        socket.on('response', async (data) => {
            setLoading(false);
            setMessages((prevMessages) => {
                const newMessages = [...prevMessages, { type: 'bot', text: data.text }];
                if (config.continuousReading) {
                    handleSpeak(data.text);
                }
                return newMessages;
            });
        });

        return () => {
            socket.off('response');
        };
    }, [config.continuousReading]);

    useEffect(() => {
        if (screenVideoRef.current && screenStream) {
            screenVideoRef.current.srcObject = screenStream;
        }
    }, [screenStream]);

    useEffect(() => {
        if (cameraVideoRef.current && cameraStream) {
            cameraVideoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    useEffect(() => {
        if (microphoneAudioRef.current && microphoneStream) {
            microphoneAudioRef.current.srcObject = microphoneStream;
        }
    }, [microphoneStream]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (message.trim() === '') return;

        const userMessage = { type: 'user', text: message };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        const context = updatedMessages.slice(-5).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'system',
            content: msg.text
        }));

        setLoading(true);
        console.log(updatedMessages);
        socket.emit('message', { text: message, context });
        setMessage('');
    };

    const handleDialogClose = (event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
            handleClose();
        }
    };

    const handleConfigOpen = () => {
        setConfigOpen(true);
    };

    const handleConfigClose = () => {
        setConfigOpen(false);
    };

    const handleMaximize = () => {
        setMaximized(!maximized);
    };

    const handleSpeak = async (text) => {
        try {
            const response = await axios.post('http://localhost:4000/synthesize', {
                text,
                voice: config.voice === 'female' ? 'Ruth' : 'Matthew'
            }, { responseType: 'arraybuffer' });
            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            return audio;
        } catch (error) {
            console.error('Error with text-to-speech synthesis:', error);
            return null;
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setShowScrollToBottom(false);
            } else {
                setShowScrollToBottom(true);
            }
        }
    };

    const toggleAnnotation = () => {
        setIsAnnotating(!isAnnotating);
    };

    const captureScreen = () => {
        const video = screenVideoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.width = canvas.width;
        annotationCanvas.height = canvas.height;
        const annotationContext = annotationCanvas.getContext('2d');
        annotationContext.drawImage(canvas, 0, 0);

        annotationCanvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                socket.emit('image-data', { image: base64data });
            };
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            PaperComponent={PaperComponent}
            maxWidth="lg"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    width: maximized ? '90vw' : 'auto',
                    height: maximized ? '90vh' : 'auto',
                    maxWidth: maximized ? 'none' : 'sm',
                    maxHeight: maximized ? 'none' : '80vh',
                    margin: maximized ? 0 : 'auto',
                }
            }}
        >
            <DialogTitle
                id="draggable-dialog-title"
                sx={{
                    cursor: 'move',
                    background: '#1e88e5',
                    color: '#fff',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '4px 4px 0 0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                }}
            >
                <Box
                    sx={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                    }}
                >
                    Pearson AI Assistant!
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        ref={settingsButtonRef}
                        aria-label="settings"
                        onClick={handleConfigOpen}
                        sx={{
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            marginRight: 1,
                        }}
                    >
                        <Settings />
                    </IconButton>
                    <IconButton
                        aria-label={maximized ? 'minimize' : 'maximize'}
                        onClick={handleMaximize}
                        sx={{
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            marginRight: 1,
                        }}
                    >
                        {maximized ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box
                    sx={{ flex: 1, overflowY: 'auto', padding: 2 }}
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                >
                    <MessageList messages={messages} loading={loading} config={config} handleSpeak={handleSpeak} />
                    <div ref={messagesEndRef} />
                </Box>
                <Box sx={{ padding: 2, position: 'sticky', bottom: 0, background: '#fff', zIndex: 1000 }}>
                    <InputArea message={message} setMessage={setMessage} handleSend={handleSend} />
                    <StreamControls
                        socket={socket}
                        isSmallScreen={isSmallScreen}
                        screenStream={screenStream}
                        cameraStream={cameraStream}
                        microphoneStream={microphoneStream}
                        setScreenStream={setScreenStream}
                        setCameraStream={setCameraStream}
                        setMicrophoneStream={setMicrophoneStream}
                        setIsListening={setIsListening}
                        isListening={isListening}
                        toggleAnnotation={toggleAnnotation}
                        captureScreen={captureScreen}
                        isAnnotating={isAnnotating}
                    />
                </Box>
                {showScrollToBottom && (
                    <Fab
                        color="primary"
                        size="small"
                        onClick={scrollToBottom}
                        sx={{ position: 'absolute', bottom: 72, left: '50%', transform: 'translateX(-50%)' }}
                    >
                        <ArrowDownward />
                    </Fab>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Close
                </Button>
            </DialogActions>
            <ConfigDialog
                open={configOpen}
                anchorEl={settingsButtonRef.current}
                handleClose={handleConfigClose}
                config={config}
                setConfig={setConfig}
            />
        </Dialog>
    );
};

export default Chatbot;
