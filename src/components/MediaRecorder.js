import React, { useState, useEffect } from "react";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
const MediaRecorder = () => {
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [codecPreferences, setCodecPreferences] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [recording, setRecording] = useState(false);

  const hasEchoCancellation = true;

  useEffect(() => {
    const init = async () => {
      try {
        const constraints = {
          audio: {
            echoCancellation: { exact: hasEchoCancellation },
          },
          video: {
            width: 1280,
            height: 720,
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        setStream(mediaStream);

        const supportedMimeTypes = getSupportedMimeTypes();
        setCodecPreferences(supportedMimeTypes);
      } catch (error) {
        console.error("navigator.getUserMedia error:", error);
        setErrorMsg(`navigator.getUserMedia error:${error.toString()}`);
      }
    };

    init();

    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getSupportedMimeTypes = () => {
    const possibleTypes = [
      "video/webm;codecs=av1,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/mp4;codecs=h264,aac",
    ];
  
    return possibleTypes.filter((mimeType) => {
      if (typeof MediaRecorder.isTypeSupported === "function") {
        return MediaRecorder.isTypeSupported(mimeType);
      }
      return true; // Assume it's supported if isTypeSupported is not available
    });
  };

  const handleDataAvailable = (event) => {
    if (event.data && event.data.size > 0) {
      setRecordedBlobs((prevBlobs) => [...prevBlobs, event.data]);
    }
  };

  const startRecording = () => {
    setRecordedBlobs([]);
    const mimeType = codecPreferences[0]; // Use the first supported mimeType
    const options = { mimeType };

    try {
      const recorder = new MediaRecorder(stream, options);
      setMediaRecorder(recorder);

      recorder.ondataavailable = handleDataAvailable;
      recorder.onstop = (event) => {
        console.log("Recorder stopped: ", event);
        console.log("Recorded Blobs: ", recordedBlobs);
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Exception while creating MediaRecorder:", error);
      setErrorMsg(
        `Exception while creating MediaRecorder: ${JSON.stringify(error)}`
      );
    }
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setRecording(false);
  };

  const playRecording = () => {
    const mimeType = codecPreferences[0].split(";", 1)[0];
    const superBuffer = new Blob(recordedBlobs, { type: mimeType });

    const recordedVideo = document.querySelector("#recorded");
    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.play();
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedBlobs, { type: "video/webm" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "test.webm";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div id="container">
      <Typography variant="h4">Media recorder</Typography>

      <video id="gum" playsInline autoPlay muted></video>
      <video id="recorded" playsInline loop></video>

      <div>
        <Button
          id="start"
          variant="contained"
          color="primary"
          disabled={!!stream}
        >
          Start camera
        </Button>
        <Button
          id="record"
          variant="contained"
          color="primary"
          onClick={recording ? stopRecording : startRecording}
          disabled={!stream}
        >
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button
          id="play"
          variant="contained"
          color="primary"
          onClick={playRecording}
          disabled={!recordedBlobs.length}
        >
          Play
        </Button>
        <Button
          id="download"
          variant="contained"
          color="primary"
          onClick={downloadRecording}
          disabled={!recordedBlobs.length}
        >
          Download
        </Button>
      </div>

      <div>
        <Typography variant="subtitle1">Recording format:</Typography>
        <Select
          id="codecPreferences"
          value={codecPreferences[0]}
          onChange={(e) => setCodecPreferences([e.target.value])}
          disabled={recording || !stream}
        >
          {codecPreferences.map((mimeType) => (
            <MenuItem key={mimeType} value={mimeType}>
              {mimeType}
            </MenuItem>
          ))}
        </Select>
      </div>

      <div>
        <Typography variant="subtitle1">
          Media Stream Constraints options:
        </Typography>
        <FormControlLabel
          control={<Checkbox id="echoCancellation" />}
          label="Echo cancellation"
          disabled={!!stream}
        />
      </div>

      <div>
        <Typography variant="subtitle1" id="errorMsg">
          {errorMsg}
        </Typography>
      </div>
    </div>
  );
};

export default MediaRecorder;
