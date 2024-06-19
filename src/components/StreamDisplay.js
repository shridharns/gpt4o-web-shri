import React, { useEffect } from 'react';
import { Box } from '@mui/material';

const StreamDisplay = ({
                           screenStream, cameraStream, microphoneStream,
                           screenVideoRef, cameraVideoRef, microphoneAudioRef,
                           canvasRef, isAnnotating
                       }) => {
    useEffect(() => {
        if (screenVideoRef.current && screenStream) {
            screenVideoRef.current.srcObject = screenStream;
            screenVideoRef.current.play();
            screenVideoRef.current.addEventListener('loadeddata', () => {
                if (canvasRef.current) {
                    canvasRef.current.width = screenVideoRef.current.videoWidth;
                    canvasRef.current.height = screenVideoRef.current.videoHeight;
                }
            });
        }
    }, [screenStream]);

    useEffect(() => {
        if (cameraVideoRef.current && cameraStream) {
            cameraVideoRef.current.srcObject = cameraStream;
            cameraVideoRef.current.play();
        }
    }, [cameraStream]);

    useEffect(() => {
        if (microphoneAudioRef.current && microphoneStream) {
            microphoneAudioRef.current.srcObject = microphoneStream;
            microphoneAudioRef.current.play();
        }
    }, [microphoneStream]);

    return (
        <Box position="relative" overflow="hidden" height="100%">
            {screenStream && (
                <>
                    <video ref={screenVideoRef} style={{ display: 'none' }} />
                    <canvas
                        ref={canvasRef}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: isAnnotating ? 'auto' : 'none' }}
                    />
                </>
            )}
            {cameraStream && (
                <video ref={cameraVideoRef} autoPlay style={{ width: '100%', height: '100%' }} />
            )}
            {microphoneStream && (
                <audio ref={microphoneAudioRef} autoPlay controls style={{ width: '100%' }} />
            )}
        </Box>
    );
};

export default StreamDisplay;
