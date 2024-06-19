import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ScreenShare, VideoCall, Mic, Stop, Hearing, Edit, Close, Clear, Done } from '@mui/icons-material';

const StreamControls = ({
                            socket,
                            isSmallScreen,
                            setIsListening,
                            isListening
                        }) => {
    const [screenStream, setScreenStream] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [microphoneStream, setMicrophoneStream] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showScreenShare, setShowScreenShare] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const screenVideoRef = useRef(null);
    const floatingCameraVideoRef = useRef(null);
    const floatingScreenVideoRef = useRef(null);
    const microphoneAudioRef = useRef(null);
    const canvasRef = useRef(null);

    const handleMediaShare = async (mediaType, setStream, constraints) => {
        try {
            const stream = await (mediaType === 'screen' ? navigator.mediaDevices.getDisplayMedia(constraints) : navigator.mediaDevices.getUserMedia(constraints));
            setStream(stream);

            if (mediaType === 'camera') {
                setShowCamera(true);
            }
            if (mediaType === 'screen') {
                setShowScreenShare(true);
            }

            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();

            video.addEventListener('loadeddata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        console.error('Failed to convert canvas to Blob.');
                        return;
                    }
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result.split(',')[1];
                        console.log('Base64 Image Data Length:', base64data.length);
                        socket.emit('image-data', { image: base64data });
                    };
                    reader.onerror = (error) => {
                        console.error('Error reading blob as base64:', error);
                    };
                }, 'image/jpeg');
            });
        } catch (err) {
            console.error(`Error sharing ${mediaType}:`, err);
        }
    };

    const handleStopShare = (stream, setStream, stopListening = false) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (stopListening) {
                setIsListening(false);
            }
            if (setStream === setCameraStream) {
                setShowCamera(false);
            }
            if (setStream === setScreenStream) {
                setShowScreenShare(false);
            }
        }
    };

    const setupCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.strokeStyle = 'red';
        context.lineWidth = 2;

        let drawing = false;

        const startDrawing = (event) => {
            drawing = true;
            context.beginPath();
            context.moveTo(event.offsetX, event.offsetY);
        };

        const draw = (event) => {
            if (!drawing) return;
            context.lineTo(event.offsetX, event.offsetY);
            context.stroke();
        };

        const stopDrawing = () => {
            drawing = false;
            context.closePath();
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseout', stopDrawing);
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const captureScreenshot = async (message) => {
        const canvas = canvasRef.current;
        const video = floatingScreenVideoRef.current;
        if (!canvas || !video) return;

        // Draw the current video frame and annotations on the canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to convert canvas to Blob.');
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                socket.emit('image-data', { image: base64data, message });
            };
            reader.onerror = (error) => {
                console.error('Error reading blob as base64:', error);
            };
        }, 'image/jpeg');
    };

    useEffect(() => {
        if (isAnnotating) {
            return setupCanvas();
        }
    }, [isAnnotating]);

    useEffect(() => {
        if (cameraStream && floatingCameraVideoRef.current) {
            floatingCameraVideoRef.current.srcObject = cameraStream;
            floatingCameraVideoRef.current.play();
        }
        if (screenStream && floatingScreenVideoRef.current) {
            floatingScreenVideoRef.current.srcObject = screenStream;
            floatingScreenVideoRef.current.play();
        }
    }, [cameraStream, screenStream, showCamera, showScreenShare]);

    useEffect(() => {
        if (microphoneStream && microphoneAudioRef.current) {
            microphoneAudioRef.current.srcObject = microphoneStream;
            microphoneAudioRef.current.play();
            const mediaRecorder = new MediaRecorder(microphoneStream, { mimeType: 'audio/webm' });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    const reader = new FileReader();
                    reader.readAsArrayBuffer(event.data);
                    reader.onloadend = () => {
                        const arrayBuffer = reader.result;
                        socket.emit('audio-data', arrayBuffer);
                    };
                }
            };

            mediaRecorder.start(1000); // Capture audio data every second

            return () => {
                mediaRecorder.stop();
            };
        }
    }, [microphoneStream]);

    return (
        <>
            <Box display="flex" justifyContent="space-between" flexWrap={isSmallScreen ? 'wrap' : 'nowrap'}>
                <Box>
                    <IconButton color="primary" onClick={() => handleMediaShare('screen', setScreenStream, { video: true })} disabled={screenStream !== null}>
                        <ScreenShare />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleStopShare(screenStream, setScreenStream)} disabled={screenStream === null}>
                        <Stop />
                    </IconButton>
                </Box>
                <Box>
                    <IconButton color="primary" onClick={() => handleMediaShare('camera', setCameraStream, { video: true })} disabled={cameraStream !== null}>
                        <VideoCall />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleStopShare(cameraStream, setCameraStream)} disabled={cameraStream === null}>
                        <Stop />
                    </IconButton>
                </Box>
                <Box>
                    <IconButton color="primary" onClick={() => handleMediaShare('audio', setMicrophoneStream, { audio: true })} disabled={microphoneStream !== null}>
                        {isListening ? <Hearing /> : <Mic />}
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleStopShare(microphoneStream, setMicrophoneStream, true)} disabled={microphoneStream === null}>
                        <Stop />
                    </IconButton>
                </Box>
            </Box>
            {showCamera && (
                <Box position="fixed" top={10} right={10} width={200} height={150} bgcolor="white" borderRadius={8} boxShadow={3} zIndex={9999}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#3f51b5" color="white" px={1} borderRadius="8px 8px 0 0">
                        <Typography variant="body2">Camera</Typography>
                        <IconButton size="small" onClick={() => handleStopShare(cameraStream, setCameraStream)} style={{ color: 'white' }}>
                            <Close />
                        </IconButton>
                    </Box>
                    <video ref={floatingCameraVideoRef} autoPlay style={{ width: '100%', height: 'calc(100% - 40px)', borderRadius: '0 0 8px 8px' }} />
                </Box>
            )}
            {showScreenShare && (
                <Box position="fixed" top={showCamera ? 170 : 10} right={10} width={600} height={450} bgcolor="white" borderRadius={8} boxShadow={3} zIndex={9999}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#3f51b5" color="white" px={1} borderRadius="8px 8px 0 0">
                        <Typography variant="body2">Screen Share</Typography>
                        <Box display="flex">
                            <IconButton size="small" onClick={() => setIsAnnotating(!isAnnotating)} style={{ color: 'white' }}>
                                <Edit />
                            </IconButton>
                            <IconButton size="small" onClick={clearCanvas} style={{ color: 'white' }}>
                                <Clear />
                            </IconButton>
                            <IconButton size="small" onClick={() => captureScreenshot("help with the highlighted area of the image")} style={{ color: 'white' }}>
                                <Done />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleStopShare(screenStream, setScreenStream)} style={{ color: 'white' }}>
                                <Close />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box position="relative" style={{ width: '100%', height: 'calc(100% - 40px)', borderRadius: '0 0 8px 8px' }}>
                        <video ref={floatingScreenVideoRef} autoPlay style={{ width: '100%', height: '100%' }} />
                        <canvas
                            ref={canvasRef}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: isAnnotating ? 'auto' : 'none' }}
                        />
                    </Box>
                </Box>
            )}
            {microphoneStream && (
                <Box position="fixed" bottom={10} right={10} width={200} bgcolor="white" borderRadius={8} boxShadow={3} zIndex={9999}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#3f51b5" color="white" px={1} borderRadius="8px 8px 0 0">
                        <Typography variant="body2">Microphone</Typography>
                        <IconButton size="small" onClick={() => handleStopShare(microphoneStream, setMicrophoneStream, true)} style={{ color: 'white' }}>
                            <Close />
                        </IconButton>
                    </Box>
                    <audio ref={microphoneAudioRef} autoPlay controls style={{ width: '100%', borderRadius: '0 0 8px 8px' }} />
                </Box>
            )}
        </>
    );
};

export default StreamControls;
