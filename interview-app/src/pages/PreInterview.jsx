import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import RecordRTC from 'recordrtc';
import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore
} from "@100mslive/react-sdk";
import DeviceSettings from '../components/DeviceSettings';
import Interview from './Interview';

const PreInterview = () => {
  const webcamRef = useRef(null);
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const [recorder, setRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [token, setToken] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [roomData, setRoomData] = useState(null);
  const [roomCode, setRoomCode] = useState(null);

  const fetchManagementToken = async () => {
    const response = await fetch(`${import.meta.env.VITE_SERVER_API}/generateManagementToken`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.token;
  }
  
  const fetchRoomData = async (managementToken) => { 
    const candidateUserame = 'candidate' + '_' + new Date().toISOString();
    console.log(candidateUserame);
    const response = await fetch(`${import.meta.env.VITE_100MS_API}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managementToken}`
      },
      body: JSON.stringify({
        name: candidateUserame,
        description: 'Lorem'
      })
    });
    const data = await response.json();
    return data;
  }
  
  const fetchRoomCode = async (managementToken, roomId) => {
    const response = await fetch(`${import.meta.env.VITE_100MS_API}/room-codes/room/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${managementToken}`
      },
    });
    const data = await response.json();
    return data;
  }



  useEffect(() => {
    window.onunload = () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };
    console.log(isConnected);
  }, [hmsActions, isConnected]);

  
  useEffect(() => {
    const fetchData = async () => {
      const token = await fetchManagementToken();
      console.log(token);
      setToken(token);
      const room = await fetchRoomData(token);
      console.log(room);
      const roomId = room.id;
      setRoomData(room)
      const roomCode = await fetchRoomCode(token, roomId);
      setRoomCode(roomCode)
      console.log(roomCode);
    };
    fetchData();
  }, []);
  

  const handleStartCapture = () => {
    const stream = webcamRef.current.stream;
    const options = { type: 'video' };
    const recordRTC = RecordRTC(stream, options);
    recordRTC.startRecording();
    setRecorder(recordRTC);
  };

  const handleStopCapture = () => {
    recorder.stopRecording(() => {
      let blob = recorder.getBlob();
      setRecordedBlob(URL.createObjectURL(blob));
    });
  };

  const handleStartInterview = async () => {
    const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode: roomCode.data[0].code })

    try {
      await hmsActions.join({ userName: roomData.name, authToken });
    } catch (e) {
      console.error(e)
    }
  }

  if(!roomCode){
    return <span>Loading ...</span>
  }

  if(isConnected){
    return <Interview room_id={roomData.id} role={roomCode.data[0].role} management_token={token}/>
  }


  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F7FAFC'}}>
      <Webcam muted audio={true} ref={webcamRef} style={{width: '16rem', height: '12rem', margin: '1rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}} />
      <div>
        <button onClick={handleStartCapture} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#4299E1', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}}>Start Recording</button>
        <button onClick={handleStopCapture} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#FC8181', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}}>Stop Recording</button>
      </div>
      {recordedBlob && (
        <video src={recordedBlob} controls style={{width: '16rem', height: '12rem', margin: '1rem', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}} />
      )}
      <div>
        <Link to={`/interview/${token}`} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#4299E1', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}}>Go To Interview</Link>
      </div>
      <div>
        <button onClick={handleStartInterview} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#4299E1', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 #1A202C'}}>Go To Interview</button>
      </div>
      <div>
        <DeviceSettings />
      </div>
    </div>
  );
};

export default PreInterview;
