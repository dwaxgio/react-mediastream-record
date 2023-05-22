import React, { useState, useRef } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Select,
  Typography,
} from "@mui/material";

import { styled } from "@mui/system";

const Container = styled("div")({
  textAlign: "center",
  padding: "20px",
});

const MediaRecorder = () => {
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playButtonDisabled, setPlayButtonDisabled] = useState(true);
  const [downloadButtonDisabled, setDownloadButtonDisabled] = useState(true);
  const [codecPreferencesDisabled, setCodecPreferencesDisabled] =
    useState(true);

  const codecPreferencesRef = useRef(null);
  const recordedVideoRef = useRef(null);

  let mediaRecorder;
  const errorMsgElement = useRef(null);

  const handleDataAvailable = (event) => {
    console.log("handleDataAvailable", event);
    if (event.data && event.data.size > 0) {
      setRecordedBlobs((prevRecordedBlobs) => [
        ...prevRecordedBlobs,
        event.data,
      ]);
    }
  };

  const getSupportedMimeTypes = () => {
    const possibleTypes = [
      "video/webm;codecs=av1,opus",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/mp4;codecs=h264,aac",
    ];
    return possibleTypes.filter((mimeType) => {
      return MediaRecorder.isTypeSupported(mimeType);
    });
  };

  const startRecording = () => {
    setRecordedBlobs([]);
    const mimeType =
      codecPreferencesRef.current.options[
        codecPreferencesRef.current.selectedIndex
      ].value;
    const options = { mimeType };

    try {
      mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
      console.error("Exception while creating MediaRecorder:", e);
      errorMsgElement.current.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(
        e
      )}`;
      return;
    }

    console.log(
      "Created MediaRecorder",
      mediaRecorder,
      "with options",
      options
    );
    setIsRecording(true);
    setPlayButtonDisabled(true);
    setDownloadButtonDisabled(true);
    setCodecPreferencesDisabled(true);
    mediaRecorder.onstop = (event) => {
      console.log("Recorder stopped: ", event);
      console.log("Recorded Blobs: ", recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log("MediaRecorder started", mediaRecorder);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const handleSuccess = (stream) => {
    setPlayButtonDisabled(false);
    console.log("getUserMedia() got stream:", stream);
    window.stream = stream;

    const gumVideo = document.querySelector("video#gum");
    gumVideo.srcObject = stream;

    getSupportedMimeTypes().forEach((mimeType) => {
      const option = document.createElement("option");
      option.value = mimeType;
      option.innerText = option.value;
      codecPreferencesRef.current.appendChild(option);
    });
    setCodecPreferencesDisabled(false);
  };

  const init = async (constraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccess(stream);
    } catch (e) {
      console.error("navigator.getUserMedia error:", e);
      errorMsgElement.current.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
  };

  const handleStartButtonClick = async () => {
    document.querySelector("button#start").disabled = true;
    const hasEchoCancellation =
      document.querySelector("#echoCancellation").checked;
    const constraints = {
      audio: {
        echoCancellation: { exact: hasEchoCancellation },
      },
      video: {
        width: 1280,
        height: 720,
      },
    };
    console.log("Using media constraints:", constraints);
    await init(constraints);
  };

  const handleRecordButtonClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
      setIsRecording(false);
      setPlayButtonDisabled(false);
      setDownloadButtonDisabled(false);
      setCodecPreferencesDisabled(false);
    }
  };

  const handlePlayButtonClick = () => {
    const mimeType = codecPreferencesRef.current.options[
      codecPreferencesRef.current.selectedIndex
    ].value.split(";", 1)[0];
    const superBuffer = new Blob(recordedBlobs, { type: mimeType });
    recordedVideoRef.current.src = null;
    recordedVideoRef.current.srcObject = null;
    recordedVideoRef.current.src = window.URL.createObjectURL(superBuffer);
    recordedVideoRef.current.controls = true;
    recordedVideoRef.current.play();
  };

  const handleDownloadButtonClick = () => {
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
    <Container>
      <Typography variant="h4">Media recorder</Typography>

      <video id="gum" playsInline autoPlay muted></video>
      <video id="recorded" playsInline loop ref={recordedVideoRef}></video>

      <div>
        <Button
          id="start"
          onClick={handleStartButtonClick}
          variant="contained"
          disabled={false}
        >
          Start camera
        </Button>
        <Button
          id="record"
          variant="contained"
          disabled={!window.stream}
          onClick={handleRecordButtonClick}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button
          id="play"
          variant="contained"
          disabled={playButtonDisabled}
          onClick={handlePlayButtonClick}
        >
          Play
        </Button>
        <Button
          id="download"
          variant="contained"
          disabled={downloadButtonDisabled}
          onClick={handleDownloadButtonClick}
        >
          Download
        </Button>
      </div>

      <div>
        Recording format:
        <Select
          id="codecPreferences"
          disabled={codecPreferencesDisabled}
          ref={codecPreferencesRef}
        ></Select>
      </div>
      <div>
        <Typography variant="h6">Media Stream Constraints options</Typography>
        <FormControlLabel
          control={<Checkbox id="echoCancellation" />}
          label="Echo cancellation"
        />
      </div>

      <div>
        <Typography component="span" ref={errorMsgElement}></Typography>
      </div>
    </Container>
  );
};

export default MediaRecorder;
