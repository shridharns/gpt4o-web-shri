import React from 'react';
import {
    DialogTitle, DialogContent, DialogActions, Button,
    FormControlLabel, Switch, MenuItem, Select, FormControl, InputLabel, Popover
} from '@mui/material';

const ConfigDialog = ({ open, anchorEl, handleClose, config, setConfig }) => {
    const handleToggleSpeaking = () => {
        setConfig({ ...config, speakingEnabled: !config.speakingEnabled });
    };

    const handleToggleContinuousReading = () => {
        setConfig({ ...config, continuousReading: !config.continuousReading });
    };

    const handleStyleChange = (event) => {
        setConfig({ ...config, conversationStyle: event.target.value });
    };

    const handleVoiceChange = (event) => {
        setConfig({ ...config, voice: event.target.value });
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            <DialogTitle>Configuration</DialogTitle>
            <DialogContent>
                <FormControlLabel
                    control={<Switch checked={config.speakingEnabled} onChange={handleToggleSpeaking} />}
                    label="Enable Speaking"
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel id="conversation-style-label">Conversation Type</InputLabel>
                    <Select
                        labelId="conversation-style-label"
                        value={config.conversationStyle}
                        onChange={handleStyleChange}
                        label="Conversation Type"
                    >
                        <MenuItem value="default">Default</MenuItem>
                        <MenuItem value="friendly">Friendly</MenuItem>
                        <MenuItem value="formal">Formal</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="voice-select-label">Voice</InputLabel>
                    <Select
                        labelId="voice-select-label"
                        value={config.voice}
                        onChange={handleVoiceChange}
                        label="Voice"
                    >
                        <MenuItem value="female">Female (Ruth)</MenuItem>
                        <MenuItem value="male">Male (Matthew)</MenuItem>
                    </Select>
                </FormControl>
                <FormControlLabel
                    control={<Switch checked={config.continuousReading} onChange={handleToggleContinuousReading} />}
                    label="Enable Continuous Reading"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">Close</Button>
            </DialogActions>
        </Popover>
    );
};

export default ConfigDialog;
