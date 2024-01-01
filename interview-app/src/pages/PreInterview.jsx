import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import RecordRTC from 'recordrtc';
import {
  selectIsConnectedToRoom,
  useHMSActions,
  useHMSStore
} from "@100mslive/react-sdk";
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
  const [recordingStatus, setRecordingStatus] = useState('not started');

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
    setRecordingStatus('start')
    const stream = webcamRef.current.stream;
    const options = { type: 'video' };
    const recordRTC = RecordRTC(stream, options);
    recordRTC.startRecording();
    setRecorder(recordRTC);
  };

  const handleStopCapture = () => {
    setRecordingStatus('stopping')
    recorder.stopRecording(() => {
      let blob = recorder.getBlob();
      setRecordedBlob(URL.createObjectURL(blob));
      setRecordingStatus('stopped')
    });
  };

  const handleStartInterview = async () => {
    const candidateRoleRoomData = roomCode.data.find(roomRoleData => roomRoleData.role === 'candidate'); 
    console.log('candidate room data');
    console.log(candidateRoleRoomData);
    const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode: candidateRoleRoomData.code })

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
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F7FAFC', padding: '1rem'}}>
  <h2 style={{color: '#2D3748', fontSize: '2rem', fontWeight: 'bold'}}>Test Your Camera and Mic before start...</h2>
  {
    recordedBlob ? (
      <video src={recordedBlob} controls style={{width: '640px', height: '480px', margin: '1rem', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', border: '1px solid #E2E8F0'}} />
    )
    :
    <Webcam muted audio={true} ref={webcamRef} style={{width: '640px', height: '480px', margin: '1rem', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', border: '1px solid #E2E8F0'}} />
  }
  <div>
    {
      recordingStatus === 'not started' ?
      (<button onClick={handleStartCapture} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#48BB78', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', fontWeight: 'bold'}}>Test</button>)
      : recordingStatus === 'start' ?
      (<button onClick={handleStopCapture} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#E53E3E', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', fontWeight: 'bold'}}>Stop Recording</button>)
      : recordingStatus === 'stopping' ?
      (<span style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#E53E3E', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', border: 'none', fontWeight: 'bold'}}>Stopping</span>)
      :
      (<button onClick={handleStartInterview} style={{padding: '0.5rem 1rem', margin: '0.5rem', color: '#FFFFFF', backgroundColor: '#48BB78', borderRadius: '0.375rem', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', cursor: 'pointer', border: 'none', fontWeight: 'bold'}}>Go To Interview</button>)
    }
  </div>
</div>

  );
};

export default PreInterview;
