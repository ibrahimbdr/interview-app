import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Interview.css';
import { useHMSActions } from "@100mslive/react-sdk";
import Webcam from 'react-webcam';

const Interview = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const questions = ['Tell me about yourself.']; 
  const hmsActions = useHMSActions();

  const endRoom = async () => {
    try {
        const lock = false;
        const reason = 'party is over';
        await hmsActions.endRoom(lock, reason);
    } catch (error) {
        console.error(error);
    }
};

  return (
    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F7FAFC', padding: '1rem'}}>
      <div style={{width: '10%'}}>
        <Timer />
      </div>
      <div style={{width: '70%'}}>
        <VideoRecorder  />
        <div>
          <p style={{textAlign: 'center', backgroundColor: 'rgb(245, 245, 245)', padding: '1rem', fontFamily: 'monospace', fontSize: '1rem'}}>{questions[questionIndex]}</p>
          <div style={{textAlign: 'end'}}>
          <button
          onClick={endRoom}
          className="button">
            Submit
          </button>
          </div>
        </div>
      </div>
      <div style={{width: '20%'}}>
        <QuestionsBar questions={questions} setQuestionIndex={setQuestionIndex} />
      </div>
    </div>
  );
};

Interview.propTypes = {
  room_id: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  management_token: PropTypes.string.isRequired,
};

function Timer() {
  const [seconds, setSeconds] = useState(800);

  useEffect(() => {
    if (seconds > 0) {
      setTimeout(() => setSeconds(seconds - 1), 1000);
    }
  });

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Use a gradient background and a circular border
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100px',
    borderRadius: '20px',
    background: '#4299E1',
    boxShadow: '0 4px 15px 0 rgba(0,0,0,0.1)'
  };

  // Use a monospace font and a white color
  const textStyle = {
    fontSize: '2em',
    fontFamily: 'monospace',
    color: '#FFFFFF'
  };

  return (
    <div style={containerStyle}>
      <div style={textStyle}>
        {minutes.toString().padStart(2, '0')}:{remainingSeconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
}


const VideoRecorder = () => {
  const hmsActions = useHMSActions();
  const webcamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  function toggle() {
    setIsActive(!isActive);
  }

  function reset() {
    setSeconds(0);
    setIsActive(false);
  }

  const startRecording = async () => {
    toggle()
    setRecording(true)
    const params = {
      meetingURL: "",
      rtmpURLs: [],
      record: true
  };
  try {
      await hmsActions.startRTMPOrRecording(params);
  } catch(err) {
      console.error("failed to start RTMP/recording", err);
  }
  };

  const stopRecording = async () => {
    reset()
    setIsActive(false)
    setRecording(false)
    try {
      await hmsActions.stopRTMPAndRecording();
  } catch (err) {
      console.error("failed to stop RTMP/recording", err);
  }
  };

  return     <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
  <Webcam muted audio={true} ref={webcamRef} style={{width: '640px', height: '480px', margin: '1rem', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', border: '1px solid #E2E8F0'}} />
  <button 
  style={{
    backgroundColor: recording ? '#E53E3E' : '#48BB78',
    color: 'white',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
  onClick={recording ? stopRecording : startRecording}>
    {recording ? <CountUpTimer seconds={seconds} setSeconds={setSeconds} isActive={isActive}/> : "Start Recording"}
  </button>
</div>;
};

const CountUpTimer = ({seconds, setSeconds, isActive}) => {


  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const minutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  return (
    <div className="app">
      <div className="time">
        {minutes.toString().padStart(2, '0')}:{displaySeconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

CountUpTimer.propTypes = {
  seconds: PropTypes.number.isRequired,
  setSeconds: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
}

const QuestionsBar = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleNextQuestion = () => {
      if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
  };

  return (
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h2 style={{ color: '#333' }}>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <p style={{ color: '#666' }}>{questions[currentQuestionIndex]}</p>
          <button style={{ padding: '10px', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '5px' }} onClick={handleNextQuestion}>
              Next Question
          </button>
          <p style={{ color: '#999' }}>{questions.length - currentQuestionIndex - 1} questions remaining</p>
      </div>
  );
};


QuestionsBar.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default Interview;
