import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './Interview.css';
import { useHMSActions } from "@100mslive/react-sdk";
import Webcam from 'react-webcam';

const Interview = ({room_id, role, management_token}) => {

  const [time, setTime] = useState(30 * 60);
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
    <div className="container">
      <div className="timer">
        <Timer time={time} setTime={setTime} />
      </div>
      <div className="recorder">
        <VideoRecorder room_id={room_id} role={role} management_token={management_token} />
        {/* <button
        onClick={startRecording}
        className="button">
          Start Recording
        </button>
        <button
        onClick={stopRecording}
        className="button">
          Stop Recording
        </button> */}
        {/* <button
        onClick={endRoom}
        className="button">
          End Room
        </button> */}
        <div>
          <p>{questions[questionIndex]}</p>
          <button
          onClick={endRoom}
          className="button">
            Submit
          </button>
        </div>
      </div>
      <div className="questions">
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

// eslint-disable-next-line no-unused-vars
const Timer = ({ time, setTime }) => {
  return <div>Timer: {time}</div>;
};

Timer.propTypes = {
  time: PropTypes.number.isRequired,
  setTime: PropTypes.func.isRequired,
};

const VideoRecorder = ({room_id, role, management_token}) => {
  console.log(room_id);
  console.log(role);
  console.log(management_token);
  const webcamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  // const hmsActions = useHMSActions()
  const startRecording = async () => {
    setRecording(true)
    const meeting_url = `https://localhost:5173/preview/${room_id}/${role}?skip_preview=true`;

    const url = `${import.meta.env.VITE_100MS_API}/recordings/room/${room_id}/start`;

    console.log(meeting_url);
    console.log(url);

    const headers = {
      'Authorization': `Bearer ${management_token}`,
      'Content-Type': 'application/json'
    };

    const payload = {
      meeting_url,
      resolution: {
        width: 1280,
        height: 720
      },
      transcription: {
        enabled: false
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);(data);
      } else {
        console.error(`Failed to start recording. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    }
  };

  const stopRecording = async () => {
    setRecording(false)
    const management_token = "<your_management_token>";

    const url = `${import.meta.env.VITE_100MS_API}/recordings/room/${room_id}/stop`;

    const headers = {
      'Authorization': `Bearer ${management_token}`,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        console.error(`Failed to stop recording. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    }
  };

  return     <div>
  <Webcam audio={false} ref={webcamRef} />
  <button onClick={recording ? stopRecording : startRecording}>
    {recording ? "Recording..." : "Start Recording"}
  </button>
</div>;
};

const QuestionsBar = ({ questions, setQuestionIndex }) => {
  return (
    <div>
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => setQuestionIndex(index)}
          className="question"
        >
          {question}
        </button>
      ))}
    </div>
  );
};

QuestionsBar.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setQuestionIndex: PropTypes.func.isRequired,
};

export default Interview;
