import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { FaceMesh } from '@mediapipe/face_mesh';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Helper functions ---
const checkGaze = (landmarks) => {
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  const nose = landmarks[1];
  if (!leftEar || !rightEar || !nose) return false;
  const faceSpan = rightEar.x - leftEar.x;
  const noseToLeft = nose.x - leftEar.x;
  const poseRatio = noseToLeft / faceSpan;
  return poseRatio < 0.3 || poseRatio > 0.7;
};
const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow((p1.z || 0) - (p2.z || 0), 2));
const calculateEAR = (landmarks) => {
  const rightEye = { p1: landmarks[33], p2: landmarks[160], p3: landmarks[158], p4: landmarks[133], p5: landmarks[153], p6: landmarks[144] };
  const leftEye = { p1: landmarks[362], p2: landmarks[385], p3: landmarks[387], p4: landmarks[263], p5: landmarks[373], p6: landmarks[380] };
  const rightEAR = (getDistance(rightEye.p2, rightEye.p6) + getDistance(rightEye.p3, rightEye.p5)) / (2 * getDistance(rightEye.p1, rightEye.p4));
  const leftEAR = (getDistance(leftEye.p2, leftEye.p6) + getDistance(leftEye.p3, leftEye.p5)) / (2 * getDistance(leftEye.p1, leftEye.p4));
  return (leftEAR + rightEAR) / 2;
};

export default function Interview() {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [status, setStatus] = useState('Ready to Start');
  const [events, setEvents] = useState([]);
  const interviewIdRef = useRef(null);
  const [faceMeshModel, setFaceMeshModel] = useState(null);
  const [objectModel, setObjectModel] = useState(null);
  const noFaceTimer = useRef(null);
  const lookingAwayTimer = useRef(null);
  const drowsinessTimer = useRef(null);
  const audioTimer = useRef(null);
  const [multiFaceFlagged, setMultiFaceFlagged] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const isDetectingObjects = useRef(false);
  const audioAnalyserRef = useRef(null);

  // --- Start Interview ---
  const handleStartInterview = async () => {
    if (!candidateName.trim()) { alert('Please enter your name to start.'); return; }
    setInterviewStarted(true);
    setStatus('Initializing...');
    try {
      const res = await axios.post('/api/interview/start', { candidateName });
      interviewIdRef.current = res.data._id;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          audioAnalyserRef.current = analyser;
          loadModels();
          startRecording(stream);
        };
      }
    } catch (err) {
      console.error(err);
      setStatus('ERROR: Could not start interview. Check camera permissions.');
      setInterviewStarted(false);
    }
  };

  // --- Flag Events ---
  const flagEvent = useCallback(async (eventType) => {
    if (!interviewIdRef.current) return;

    const newEvent = { time: new Date().toLocaleTimeString(), event: eventType };
    setEvents(prev => [newEvent, ...prev]);

    toast.warning(eventType, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: { backgroundColor: 'red', color: 'white', fontWeight: 'bold' }
    });

    try { 
        await axios.post('/api/log', { eventType, interviewId: interviewIdRef.current }); 
    } catch (err) { console.error(err); }
  }, []);

  // --- FaceMesh Results ---
  const onFaceMeshResults = useCallback((results) => {
    const faces = results.multiFaceLandmarks;
    if (!faces || faces.length === 0) {
      if (!noFaceTimer.current) noFaceTimer.current = setTimeout(() => { flagEvent('NO_FACE_DETECTED (10s)'); noFaceTimer.current=null; }, 10000);
    } else { if (noFaceTimer.current) clearTimeout(noFaceTimer.current); noFaceTimer.current = null; }

    if (faces && faces.length > 1) { if (!multiFaceFlagged) { flagEvent('MULTIPLE_FACES_DETECTED'); setMultiFaceFlagged(true); } } 
    else { if (multiFaceFlagged) setMultiFaceFlagged(false); }

    if (faces && faces.length === 1) {
      const landmarks = faces[0];
      const isLookingAway = checkGaze(landmarks);
      if (isLookingAway) {
        if (!lookingAwayTimer.current) lookingAwayTimer.current = setTimeout(() => { flagEvent('LOOKING_AWAY (5s)'); lookingAwayTimer.current=null; }, 5000);
      } else { if (lookingAwayTimer.current) clearTimeout(lookingAwayTimer.current); lookingAwayTimer.current=null; }

      const ear = calculateEAR(landmarks);
      const EAR_THRESHOLD = 0.2;
      if (ear < EAR_THRESHOLD) { if (!drowsinessTimer.current) drowsinessTimer.current = setTimeout(() => { flagEvent('DROWSINESS_DETECTED (3s)'); drowsinessTimer.current=null; }, 3000); } 
      else { if (drowsinessTimer.current) clearTimeout(drowsinessTimer.current); drowsinessTimer.current=null; }
    } else { if (lookingAwayTimer.current) clearTimeout(lookingAwayTimer.current); if (drowsinessTimer.current) clearTimeout(drowsinessTimer.current); }
  }, [flagEvent, multiFaceFlagged]);

  // --- Load Models ---
  const loadModels = async () => {
    setStatus('Loading CV Models...');
    try {
      await tf.ready();
      const objModel = await cocoSsd.load({ base: 'mobilenet_v2' });
      setObjectModel(objModel);
      const faceModel = new FaceMesh({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      faceModel.setOptions({ maxNumFaces: 5, refineLandmarks: true, minDetectionConfidence: 0.5 });
      setFaceMeshModel(faceModel);
      setStatus('Models Loaded. Camera ON.');
    } catch (err) { console.error(err); setStatus('ERROR: Could not load CV models.'); }
  };

  useEffect(() => { if (faceMeshModel) faceMeshModel.onResults(onFaceMeshResults); }, [faceMeshModel, onFaceMeshResults]);

  const handleObjectDetections = (predictions) => {
    const detected = new Set(predictions.map(p => p.class));
    if (detected.has('cell phone')) flagEvent('PHONE_DETECTED');
    if (detected.has('book')) flagEvent('BOOK_DETECTED');
    if (detected.has('laptop') || detected.has('tv')) flagEvent('EXTRA_DEVICE_DETECTED');
  };

  // --- Intervals for detection ---
  useEffect(() => {
    if (!interviewStarted) return;
    const faceInterval = setInterval(() => { if (faceMeshModel && videoRef.current?.readyState===4) faceMeshModel.send({ image: videoRef.current }); }, 500);
    const objInterval = setInterval(async () => {
      if (objectModel && videoRef.current?.readyState===4 && !isDetectingObjects.current) {
        isDetectingObjects.current = true;
        try { const pred = await objectModel.detect(videoRef.current, 20, 0.4); handleObjectDetections(pred); } 
        catch(err){ console.error(err); }
        finally { isDetectingObjects.current=false; }
      }
    }, 5000);
    const audioInterval = setInterval(() => {
      if (audioAnalyserRef.current) {
        const arr = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
        audioAnalyserRef.current.getByteFrequencyData(arr);
        const avg = arr.reduce((a,v)=>a+v,0)/arr.length;
        if (avg>30) { if(!audioTimer.current)audioTimer.current=setTimeout(()=>{ flagEvent('BACKGROUND_VOICE (3s)'); audioTimer.current=null; },3000);} 
        else { if(audioTimer.current){ clearTimeout(audioTimer.current); audioTimer.current=null; } }
      }
    }, 500);
    return ()=>{ clearInterval(faceInterval); clearInterval(objInterval); clearInterval(audioInterval); };
  }, [faceMeshModel, objectModel, interviewStarted]);

  const startRecording = (stream) => {
    recordedChunksRef.current=[];
    try { mediaRecorderRef.current=new MediaRecorder(stream,{mimeType:'video/webm'}); } 
    catch(err){ console.error(err); mediaRecorderRef.current=null; return; }
    mediaRecorderRef.current.ondataavailable = (e)=>{ if(e.data.size>0) recordedChunksRef.current.push(e.data); };
    mediaRecorderRef.current.onstop = ()=>{ const blob = new Blob(recordedChunksRef.current,{type:'video/webm'}); uploadVideo(blob); };
    mediaRecorderRef.current.start();
  };

  const stopRecording = ()=>{ if(mediaRecorderRef.current?.state==='recording') mediaRecorderRef.current.stop(); };

  const uploadVideo = async (blob)=>{
    setStatus('Uploading video...');
    const formData = new FormData();
    formData.append('video', blob, 'candidate-recording.webm');
    formData.append('interviewId', interviewIdRef.current);
    try{ await axios.post('/api/upload-video',formData,{headers:{'Content-Type':'multipart/form-data'}}); navigate(`/interview/${interviewIdRef.current}`); }
    catch(err){ console.error(err); setStatus('ERROR: Could not upload video.'); }
  };

  // --- UI ---
  if (!interviewStarted) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-6">
      <ToastContainer />
      <div className="w-full max-w-md bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-white text-center mb-6">AI Proctoring System</h1>
        <p className="text-gray-400 text-center mb-8">Enter your details below to begin the interview</p>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter your full name"
            value={candidateName}
            onChange={e => setCandidateName(e.target.value)}
            className="w-full p-4 rounded-xl bg-[#071127] border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStartInterview}
            className="flex-1 py-4 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}

  return(
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col items-center px-6 py-8">
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-6">Interview in Progress</h1>
      <div className="mb-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full shadow-lg text-lg font-semibold text-white">Candidate: {candidateName}</div>
      <div className="w-full max-w-3xl bg-[#071127] rounded-xl shadow-2xl overflow-hidden relative border border-gray-800 mb-6">
        <video ref={videoRef} autoPlay muted width="640" height="480" className="w-full h-auto rounded-lg bg-black"/>
        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm font-medium border border-gray-700">{status}</div>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={stopRecording} className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 font-bold shadow-md">Stop Interview & Save</button>
        <div className="text-sm text-gray-400">Models: {faceMeshModel?'FaceMesh ✓':'FaceMesh —'} • {objectModel?'ObjectModel ✓':'ObjectModel —'}</div>
      </div>
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-[#071127] rounded-xl shadow-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-2">Live Status</h2>
          <p className={`text-lg ${status.includes('ERROR')?'text-red-400':'text-green-400'}`}>{status}</p>
          <p className="mt-3 text-sm text-gray-400">Realtime monitoring: face, gaze, drowsiness, objects, audio</p>
        </div>
        <div className="p-5 bg-[#071127] rounded-xl shadow-lg border border-gray-800 h-48 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2 text-gray-200">Detected Events</h3>
          <ul className="space-y-1 text-yellow-300 text-sm">
            {events.length===0 ? <li className="text-gray-500 italic">No events detected yet</li> : events.map((e,i)=><li key={i} className="flex gap-2"><span className="font-mono text-xs text-gray-300">{e.time}</span> <span>{e.event}</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
