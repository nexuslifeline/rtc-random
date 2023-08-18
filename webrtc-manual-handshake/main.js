const WEBRTC_PEER_SERVER = '';
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }
];

let timerInterval;
let peerConn;

peerConn = new RTCPeerConnection({ iceServers: ICE_SERVERS });

peerConn.ontrack = event => {
  console.log('ontrack')
  document.getElementById('video-preview').srcObject = event.streams[0];
};


async function askMediaAccessAndGetStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

function previewVideo(stream) {
  const videoPreview = document.getElementById('video-preview');
  videoPreview.srcObject = stream
  videoPreview.play()
}

async function onOfferCreate() {
  peerConn.onicecandidate = async (event) => {
    console.log('peerConn')
    //Event that fires off when a new offer ICE candidate is created
    if(event.candidate){
        document.getElementById('localDescription').value = JSON.stringify(peerConnection.localDescription)
    }
  }

  const offer = await peerConn.createOffer();
  peerConn.setLocalDescription(offer)
}

async function onAddAnswer() {
  peerConn.onicecandidate = async (event) => {
    //Event that fires off when a new answer ICE candidate is created
    if(event.candidate){
        document.getElementById('answer').textContent = JSON.stringify(peerConnection.localDescription)
    }
  };

  const offer = JSON.parse(document.getElementById('offer').value)
  peerConn.setRemoteDescription(offer);
  const answer = await peerConn.createAnswer()
  peerConn.setLocalDescription(answer)
}

async function startStreaming() {
  const stream = await askMediaAccessAndGetStream();

  if (!stream) return;

  stream.getTracks().forEach(track => peerConn.addTrack(track, stream));

  const answer = JSON.parse(document.getElementById('answer').value)

  if (!peerConn.currentRemoteDescription){
    peerConn.setRemoteDescription(answer);
  }
}


function resetPreview() {
  const videoPreview = document.getElementById('video-preview');
  videoPreview.pause();
  videoPreview.currentTime = 0;
  videoPreview.srcObject = null
}

function startTimer() {
  const timerElement = document.getElementById('timer');
  let seconds = 0;
  let minutes = 0;
  let hours = 0;

  function updateTimer() {
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
    }

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerElement.textContent = formattedTime;
  }
  timerElement.textContent = '00:00:00';
  timerInterval = setInterval(updateTimer, 1000);
}

function toMB(chunks) {
  const totalSizeBytes = chunks.reduce((total, chunk) => total + chunk.size, 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  return totalSizeMB;
}

function updateSize(chunks) {
  const sizeElement = document.getElementById('file-size');
  sizeElement.textContent = toMB(chunks)
}

async function start() {
  const stream = await askMediaAccessAndGetStream();

  if (!stream) return;

  previewVideo(stream);
  startStreamingToServer(stream);
  startTimer();
}

function stop() {
  resetPreview();
  clearInterval(timerInterval);
  stopStreamingToServer();
}