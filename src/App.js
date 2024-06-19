import logo from './logo.svg';
import './App.css';
import Chatbot from './components/Chatbot';
import Welcome from './components/Welcome';
import {useState} from "react";

function App() {

    const [started, setStarted] = useState(false);
    const [open, setOpen] = useState(false);

    const handleStart = () => {
        setStarted(true);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            {!started && <Welcome onStart={handleStart} />}
            {started && <Chatbot open={open} handleClose={handleClose} />}
        </div>
    );
}

export default App;
