import React, { useEffect, useRef } from 'react';
import { TextField, IconButton } from '@mui/material';
import { Send } from '@mui/icons-material';

const InputArea = ({ message, setMessage, handleSend }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <TextField
            variant="outlined"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            autoComplete="off"
            InputProps={{
                endAdornment: (
                    <IconButton color="primary" onClick={handleSend}>
                        <Send />
                    </IconButton>
                ),
            }}
            multiline
            rows={2}
            inputRef={inputRef}
        />
    );
};

export default InputArea;
