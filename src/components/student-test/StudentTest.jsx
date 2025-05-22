import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useTest,
  useStartTest,
  useSubmitTest,
  useUploadRecording,
} from "../../hooks/useTests";
import "./StudentTest.css";
import { toast } from "react-hot-toast";

const StudentTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: test, isLoading: testLoading, error: testError } = useTest(id);
  const startTestMutation = useStartTest();
  const submitTestMutation = useSubmitTest();
  const uploadRecordingMutation = useUploadRecording();
  const containerRef = useRef(null);
  const videoPreviewRef = useRef(null); // Ref for device check video preview

  // Device Check Modal States
  const [showDeviceCheckModal, setShowDeviceCheckModal] = useState(true); // Show by default
  const [cameraPreviewStream, setCameraPreviewStream] = useState(null);
  const [micPermissionOk, setMicPermissionOk] = useState(false);
  const [cameraPermissionOk, setCameraPermissionOk] = useState(false);
  const [deviceCheckError, setDeviceCheckError] = useState("");
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [isEnumeratingDevices, setIsEnumeratingDevices] = useState(true);

  // Microphone visualizer states
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const [micVolume, setMicVolume] = useState(0); // For visualizer bar height
  const [isMicrophoneSilent, setIsMicrophoneSilent] = useState(false);
  const silenceDetectionRef = useRef({
    consecutiveSilentFrames: 0,
    lastVolume: 0,
  });
  const SILENCE_THRESHOLD = 5; // Adjust as needed, this is average amplitude out of 255
  const SILENT_FRAMES_LIMIT = 100; // Approx 1.6 seconds if 60 FPS

  // State for timer
  const [remainingTime, setRemainingTime] = useState(null);
  const [testEndTime, setTestEndTime] = useState(null);

  // State for proctoring
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const maxViolations = 5;

  // Test attempt state
  const [testAttempt, setTestAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for video/audio recording
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoPermissionError, setVideoPermissionError] = useState(false);
  const [currentViolationMessage, setCurrentViolationMessage] = useState("");
  const violationMessageTimerRef = useRef(null);

  // Moved this useEffect to the top level with other hooks
  useEffect(() => {
    if (currentViolationMessage) {
      if (violationMessageTimerRef.current) {
        clearTimeout(violationMessageTimerRef.current);
      }
      violationMessageTimerRef.current = setTimeout(() => {
        setCurrentViolationMessage("");
      }, 5000); // Display violation for 5 seconds
    }
    return () => {
      if (violationMessageTimerRef.current) {
        clearTimeout(violationMessageTimerRef.current);
      }
    };
  }, [currentViolationMessage]);

  // Device Enumeration
  useEffect(() => {
    const enumerateDevices = async () => {
      if (!showDeviceCheckModal) return;
      setIsEnumeratingDevices(true);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); // Request permission first
      } catch (err) {
        // Handle initial permission denial if necessary, or let performDeviceCheck handle it
        console.warn(
          "Initial permission request for enumeration failed or was denied:",
          err
        );
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(
          (device) => device.kind === "audioinput"
        );
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setAudioInputDevices(audioDevices);
        setVideoInputDevices(videoDevices);

        if (audioDevices.length > 0 && !selectedAudioDeviceId) {
          setSelectedAudioDeviceId(audioDevices[0].deviceId);
        }
        if (videoDevices.length > 0 && !selectedVideoDeviceId) {
          setSelectedVideoDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
        setDeviceCheckError(
          "Could not list audio/video devices. Please ensure permissions are granted."
        );
      } finally {
        setIsEnumeratingDevices(false);
      }
    };

    enumerateDevices();
  }, [showDeviceCheckModal]);

  // Device Check Logic
  const performDeviceCheck = async (audioIdToUse, videoIdToUse) => {
    setDeviceCheckError("");
    // Permissions are reset here, but visualizer/active state needs careful handling
    // setCameraPermissionOk(false); // Will be set based on actual stream
    // setMicPermissionOk(false); // Will be set based on actual stream

    const currentAudioId = audioIdToUse || selectedAudioDeviceId;
    const currentVideoId = videoIdToUse || selectedVideoDeviceId;

    if (cameraPreviewStream) {
      // Stop any existing preview stream
      cameraPreviewStream.getTracks().forEach((track) => track.stop());
      setCameraPreviewStream(null);
    }
    // Also stop main recording stream if active from a previous check that failed to proceed
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (!currentAudioId && audioInputDevices.length > 0) {
      // Should not happen if enumeration is complete and devices exist
      console.warn(
        "No audio device ID, but devices available. Defaulting may occur."
      );
    }
    if (!currentVideoId && videoInputDevices.length > 0) {
      console.warn(
        "No video device ID, but devices available. Defaulting may occur."
      );
    }

    const constraints = {
      audio: currentAudioId ? { deviceId: { exact: currentAudioId } } : true,
      video: currentVideoId ? { deviceId: { exact: currentVideoId } } : true,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraPreviewStream(stream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      setCameraPermissionOk(true);
      setMicPermissionOk(true); // Basic permission granted
      toast.success("Camera and Microphone access granted!", {
        duration: 2000,
      });
      if (test?.requiresRecording) {
        setupMicrophoneVisualizer(stream); // Setup visualizer only if recording is required
      }
    } catch (err) {
      console.error("Device check error:", err);
      let message = "Could not access camera or microphone.";
      if (err.name === "NotFoundError") {
        message = "No camera or microphone found. Please connect your devices.";
      } else if (err.name === "NotAllowedError") {
        message =
          "Permission denied for camera or microphone. Please allow access in your browser settings.";
      }
      setDeviceCheckError(message);
      toast.error(message, { duration: 4000 });
      setCameraPermissionOk(false);
      setMicPermissionOk(false);
    }
  };

  useEffect(() => {
    if (
      showDeviceCheckModal &&
      !isEnumeratingDevices &&
      (selectedAudioDeviceId || selectedVideoDeviceId)
    ) {
      performDeviceCheck(selectedAudioDeviceId, selectedVideoDeviceId);
    }
    // Cleanup stream when modal is hidden or component unmounts
    return () => {
      if (cameraPreviewStream) {
        cameraPreviewStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [
    showDeviceCheckModal,
    isEnumeratingDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
  ]); // Rerun when selection changes or modal opens

  const handleProceedFromDeviceCheck = () => {
    if (cameraPreviewStream) {
      // Stop preview stream before proceeding
      cameraPreviewStream.getTracks().forEach((track) => track.stop());
      setCameraPreviewStream(null);
    }
    setShowDeviceCheckModal(false);
    // Test initialization will now proceed via the main useEffect
  };

  // Main Test Initialization Effect
  useEffect(() => {
    // If device check isn't done, or test data isn't loaded, wait.
    if (showDeviceCheckModal || !test) {
      return;
    }

    // At this point, device check is done, and test data should be available.
    // Protected route should ensure user is logged in.
    if (!testAttempt) {
      startTest();
    }

    // Load violations and end time from localStorage (can happen regardless of testAttempt state)
    const savedViolations = localStorage.getItem(`violations_${id}`);
    if (savedViolations) setViolations(parseInt(savedViolations, 10));

    const savedEndTime = localStorage.getItem(`testEndTime_${id}`);
    if (savedEndTime) {
      const endTimeMs = parseInt(savedEndTime, 10);
      if (endTimeMs > Date.now()) setTestEndTime(endTimeMs);
      else localStorage.removeItem(`testEndTime_${id}`);
    }
  }, [id, test, testAttempt, showDeviceCheckModal]);

  // Calculate and set initial end time
  useEffect(() => {
    if (testAttempt && test?.duration && !testEndTime) {
      const attemptStartedAt = new Date(testAttempt.startedAt).getTime();
      const durationMs = (test.duration || 0) * 60 * 1000;
      const calculatedEndTime = attemptStartedAt + durationMs;
      const now = Date.now();

      if (calculatedEndTime > now) {
        setTestEndTime(calculatedEndTime);
        localStorage.setItem(`testEndTime_${id}`, calculatedEndTime.toString());
      } else {
        handleSubmitTest("Test duration expired upon loading.");
      }
    }
  }, [testAttempt, test, testEndTime, id]);

  // Timer countdown
  useEffect(() => {
    if (!testAttempt || !testEndTime || isSubmitting) {
      setRemainingTime(null);
      return;
    }
    const timer = setInterval(() => {
      const now = Date.now();
      const timeLeftMs = testEndTime - now;
      if (timeLeftMs <= 0) {
        clearInterval(timer);
        setRemainingTime({ hours: 0, minutes: 0, seconds: 0 });
        handleSubmitTest("Time expired.");
        return;
      }
      const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
      setRemainingTime({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, [testAttempt, testEndTime, isSubmitting]);

  // Video Recording Logic
  const startRecording = async () => {
    if (!test?.requiresRecording) return; // Do not start recording if not required by test setting
    if (!testAttempt || isRecording || !isFullscreen || success || isSubmitting)
      return;

    setShowVideoPrompt(false);
    setVideoError("");
    setVideoPermissionError(false);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm",
      });
      recordedChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const formData = new FormData();
        formData.append("recording", blob, "student-recording.webm");
        recordedChunksRef.current = [];
        setIsRecording(false);

        if (!testAttempt?.id || !id) {
          toast.error("Cannot upload recording: Missing test or attempt ID.");
          console.error(
            "Missing testAttempt.id or test.id for recording upload"
          );
          return;
        }
        toast.loading("Uploading recording...", { id: "upload-toast" });
        try {
          await uploadRecordingMutation.mutateAsync({
            testId: id,
            attemptId: testAttempt.id,
            formData,
          });
          toast.success("Recording uploaded successfully!", {
            id: "upload-toast",
          });
        } catch (uploadError) {
          console.error("Failed to upload recording:", uploadError);
          toast.error(
            `Failed to upload recording: ${
              uploadError.response?.data?.message || uploadError.message
            }`,
            { id: "upload-toast" }
          );
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Screen and audio recording started.", { duration: 3000 });
    } catch (err) {
      console.error("Error starting recording:", err);
      let errorMessage = `Failed to start recording: ${err.message}.`;
      if (
        err.name === "NotAllowedError" ||
        err.message.includes("Permission denied")
      ) {
        errorMessage =
          "Camera/microphone permission denied for recording. Please allow access in browser settings.";
        setVideoPermissionError(true);
        setShowVideoPrompt(true);
      }
      setVideoError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (
      testAttempt &&
      isFullscreen &&
      !isRecording &&
      !success &&
      !isSubmitting &&
      !showFullscreenPrompt &&
      !videoPermissionError &&
      test?.requiresRecording
    ) {
      if (!streamRef.current && !showVideoPrompt) {
        setShowVideoPrompt(true);
      }
    } else if (!isFullscreen && isRecording) {
      stopRecording();
      toast.warn("Recording stopped as you exited fullscreen.", {
        duration: 4000,
      });
    }
  }, [
    testAttempt,
    isFullscreen,
    isRecording,
    success,
    isSubmitting,
    showFullscreenPrompt,
    videoPermissionError,
    test,
  ]);

  useEffect(() => {
    return () => {
      stopRecording();
      if (cameraPreviewStream) {
        cameraPreviewStream.getTracks().forEach((track) => track.stop());
      }
      cleanupMicrophoneVisualizer();
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [cameraPreviewStream]);

  // Microphone Visualizer Logic
  const cleanupMicrophoneVisualizer = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    // Don't close the audio context here, as it might be reused quickly
    // It will be closed on component unmount or when modal fully closes.
    setMicVolume(0);
    // setIsMicrophoneSilent(false); // Reset this based on new stream checks
  };

  const setupMicrophoneVisualizer = (stream) => {
    cleanupMicrophoneVisualizer(); // Clean up previous instances

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256; // Smaller FFT size for faster processing
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    sourceNodeRef.current =
      audioContextRef.current.createMediaStreamSource(stream);
    sourceNodeRef.current.connect(analyserRef.current);

    silenceDetectionRef.current = { consecutiveSilentFrames: 0, lastVolume: 0 };
    setIsMicrophoneSilent(false); // Reset silence state for new stream

    drawVisualizer();
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return;
    }
    animationFrameIdRef.current = requestAnimationFrame(drawVisualizer);
    analyserRef.current.getByteFrequencyData(dataArrayRef.current); // or getByteTimeDomainData

    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const averageVolume = sum / dataArrayRef.current.length;
    setMicVolume(averageVolume);

    // Silence Detection
    if (averageVolume < SILENCE_THRESHOLD) {
      silenceDetectionRef.current.consecutiveSilentFrames++;
    } else {
      silenceDetectionRef.current.consecutiveSilentFrames = 0;
    }

    if (
      silenceDetectionRef.current.consecutiveSilentFrames > SILENT_FRAMES_LIMIT
    ) {
      if (!isMicrophoneSilent) {
        // Check if mic permission was previously okay to avoid redundant toasts
        if (micPermissionOk && !isMicrophoneSilent) {
          toast.error(
            "No sound detected from microphone. Please check if it's muted or speak louder.",
            { duration: 4000 }
          );
        }
        setIsMicrophoneSilent(true);
      }
    } else {
      if (isMicrophoneSilent) {
        setIsMicrophoneSilent(false);
        // Optional: toast.success("Microphone sound detected!", { duration: 2000 });
      }
    }
    silenceDetectionRef.current.lastVolume = averageVolume;
  };

  // Proctoring event listeners
  useEffect(() => {
    if (!testAttempt || isSubmitting || success || videoPermissionError) {
      if (isRecording) stopRecording();
      return;
    }
    const container = containerRef.current;
    const handleViolation = (reason) => {
      if (isSubmitting || success) return;
      const currentViolations = violations + 1;
      setViolations(currentViolations);
      localStorage.setItem(`violations_${id}`, currentViolations.toString());
      const message = `Violation Detected (${currentViolations}/${maxViolations}): ${reason}`;
      console.warn(message);
      setCurrentViolationMessage(message);
      if (currentViolations >= maxViolations) {
        handleSubmitTest(
          `Auto-submitted due to exceeding ${maxViolations} violations.`
        );
      }
    };
    const preventManipulation = (e) => {
      e.preventDefault();
      handleViolation(
        `${e.type.charAt(0).toUpperCase() + e.type.slice(1)} Attempted`
      );
    };
    container?.addEventListener("copy", preventManipulation);
    container?.addEventListener("paste", preventManipulation);
    container?.addEventListener("cut", preventManipulation);
    const preventContextMenu = (e) => {
      e.preventDefault();
      handleViolation("Context Menu Opened");
    };
    document.addEventListener("contextmenu", preventContextMenu);
    const preventShortcuts = (e) => {
      if (e.key === "F12") {
        e.preventDefault();
        handleViolation("Developer Tools Attempted (F12)");
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["I", "J", "C"].includes(e.key.toUpperCase())
      ) {
        e.preventDefault();
        handleViolation(
          `Developer Tools Attempted (Ctrl+Shift+${e.key.toUpperCase()})`
        );
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === "R") {
        e.preventDefault();
        handleViolation("Page Reload Attempted (Ctrl+R)");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === "U") {
        e.preventDefault();
        handleViolation("View Source Attempted (Ctrl+U)");
      }
    };
    document.addEventListener("keydown", preventShortcuts);
    const handleFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(currentlyFullscreen);
      if (testAttempt && !currentlyFullscreen && !isSubmitting && !success) {
        handleViolation("Exited Fullscreen");
        setShowFullscreenPrompt(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && !isSubmitting && !success) {
        handleViolation("Switched Tab/Window");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      container?.removeEventListener("copy", preventManipulation);
      container?.removeEventListener("paste", preventManipulation);
      container?.removeEventListener("cut", preventManipulation);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventShortcuts);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    testAttempt,
    violations,
    isSubmitting,
    success,
    id,
    maxViolations,
    isRecording,
    videoPermissionError,
    test,
  ]);

  const requestFullscreen = async () => {
    const element = containerRef.current;
    if (element) {
      try {
        await element.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenPrompt(false);
      } catch (err) {
        console.error("Failed to enter fullscreen:", err);
        setError(
          `Could not enter fullscreen mode. Please enable it manually if possible. Error: ${err.message}`
        );
      }
    }
  };

  const startTest = async () => {
    if (showDeviceCheckModal || !cameraPermissionOk || !micPermissionOk) {
      setError(
        "Please complete device check and grant permissions before starting the test."
      );
      if (!showDeviceCheckModal) setShowDeviceCheckModal(true);
      return;
    }

    try {
      setError("");
      setSuccess("");
      setVideoError("");
      setVideoPermissionError(false);
      setShowVideoPrompt(false);
      setViolations(0);
      localStorage.removeItem(`violations_${id}`);
      localStorage.removeItem(`testEndTime_${id}`);
      setTestEndTime(null);
      setRemainingTime(null);

      const response = await startTestMutation.mutateAsync(id);
      if (response.status === "COMPLETED") {
        setSuccess("Test completed. Redirecting to results...");
        stopRecording();
        setTimeout(() => navigate(`/test-results/${id}`), 2000);
        return;
      }
      if (response.status === "MAX_ATTEMPTS_REACHED") {
        setError(response.message || "Max attempts reached.");
        stopRecording();
        return;
      }
      setTestAttempt(response.attempt);
      setShowFullscreenPrompt(true);

      if (test && test.questions) {
        const initialAnswers = {};
        test.questions.forEach((question) => {
          initialAnswers[question.id] = {
            questionId: question.id,
            status: "not-attempted",
            optionId: null,
            selectedOptions: [],
            textAnswer: "",
            codeAnswer:
              question.type === "CODING" ? question.starterCode || "" : "",
          };
        });
        setAnswers(initialAnswers);
      }
    } catch (err) {
      console.error("Error starting test:", err);
      setError(
        err.response?.data?.message || "Failed to start test. Please try again."
      );
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        optionId,
        status: "answered",
      },
    }));
  };

  const handleCheckboxSelect = (questionId, optionId, isChecked) => {
    setAnswers((prev) => {
      const currentAnswer = prev[questionId] || {
        questionId,
        selectedOptions: [],
        status: "not-attempted",
      };
      let selectedOptions = [...(currentAnswer.selectedOptions || [])];

      if (isChecked) {
        selectedOptions.push(optionId);
      } else {
        selectedOptions = selectedOptions.filter((id) => id !== optionId);
      }

      return {
        ...prev,
        [questionId]: {
          ...currentAnswer,
          questionId,
          selectedOptions,
          status: selectedOptions.length > 0 ? "answered" : "not-attempted",
        },
      };
    });
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        textAnswer: text,
        status: text.trim() ? "answered" : "not-attempted",
      },
    }));
  };

  const handleCodeAnswer = (questionId, code) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        codeAnswer: code,
        status: code.trim() ? "answered" : "not-attempted",
      },
    }));
  };

  const handleSubmitTest = async (reason = "Submitted by user.") => {
    if (isSubmitting) return;
    stopRecording();
    // if (document.fullscreenElement) { // Keep this commented or remove
    //   try {
    //     await document.exitFullscreen();
    //   } catch (err) {
    //     console.error("Could not exit fullscreen before submit:", err);
    //   }
    // }
    try {
      setIsSubmitting(true);
      setError("");
      console.log(`Submitting test. Reason: ${reason}`);
      let formattedAnswers = Object.values(answers).flatMap((answer) => {
        const {
          questionId,
          optionId,
          selectedOptions,
          textAnswer,
          codeAnswer,
        } = answer;
        if (selectedOptions && selectedOptions.length > 0) {
          return selectedOptions.map((optId) => ({
            questionId,
            optionId: optId,
            textAnswer: null,
            codeAnswer: null,
          }));
        } else {
          return [
            {
              questionId,
              optionId: optionId || null,
              textAnswer: textAnswer || null,
              codeAnswer: codeAnswer || null,
            },
          ];
        }
      });
      await submitTestMutation.mutateAsync({
        id,
        answers: formattedAnswers,
      });
      localStorage.removeItem(`violations_${id}`);
      localStorage.removeItem(`testEndTime_${id}`);
      setSuccess(`Test submitted successfully! (${reason})`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error submitting test:", error);
      setError(
        error.response?.data?.message ||
          `Failed to submit test. Reason: ${reason}. Please try again or contact support.`
      );
      setIsSubmitting(false);
    }
  };

  // Render Logic - Simplified initial checks
  if (showDeviceCheckModal) {
    return (
      <div className="device-check-modal overlay">
        <div className="device-check-content">
          <h2>Device Check</h2>
          {isEnumeratingDevices && <p>Loading devices...</p>}
          {deviceCheckError && (
            <div
              className="error-message"
              style={{ marginBottom: "15px" }}>
              {deviceCheckError}
            </div>
          )}

          {!isEnumeratingDevices && (
            <div
              className="device-selectors"
              style={{ marginBottom: "15px" }}>
              <div style={{ marginBottom: "10px" }}>
                <label htmlFor="video-device-select">Camera: </label>
                <select
                  id="video-device-select"
                  value={selectedVideoDeviceId}
                  onChange={(e) => setSelectedVideoDeviceId(e.target.value)}
                  disabled={videoInputDevices.length === 0}>
                  {videoInputDevices.length === 0 && (
                    <option value="">No cameras found</option>
                  )}
                  {videoInputDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}>
                      {device.label ||
                        `Camera ${videoInputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="audio-device-select">Microphone: </label>
                <select
                  id="audio-device-select"
                  value={selectedAudioDeviceId}
                  onChange={(e) => setSelectedAudioDeviceId(e.target.value)}
                  disabled={audioInputDevices.length === 0}>
                  {audioInputDevices.length === 0 && (
                    <option value="">No microphones found</option>
                  )}
                  {audioInputDevices.map((device) => (
                    <option
                      key={device.deviceId}
                      value={device.deviceId}>
                      {device.label ||
                        `Microphone ${audioInputDevices.indexOf(device) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="camera-preview-container">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                maxHeight: "200px",
                border: "1px solid #ccc",
                backgroundColor: "#000",
              }}></video>
            {!cameraPermissionOk && !deviceCheckError && (
              <p>Attempting to access camera...</p>
            )}
            {cameraPermissionOk && (
              <p style={{ color: "green" }}>✓ Camera Access Granted</p>
            )}
          </div>
          <div
            className="mic-status-container"
            style={{ marginTop: "10px" }}>
            {!micPermissionOk && !deviceCheckError && !isEnumeratingDevices && (
              <p>Attempting to access microphone...</p>
            )}
            {micPermissionOk && (
              <p style={{ color: "green" }}>✓ Microphone Access Granted</p>
            )}
            {/* Microphone Visualizer Bar */}
            {micPermissionOk && (
              <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                <p>Microphone Level:</p>
                <div
                  style={{
                    width: "100%",
                    height: "20px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}>
                  <div
                    style={{
                      width: `${Math.min(100, (micVolume / 255) * 400)}%`, // Amplify visualization a bit
                      height: "100%",
                      backgroundColor: isMicrophoneSilent ? "red" : "green",
                      transition: "width 0.1s ease-out",
                    }}></div>
                </div>
                {isMicrophoneSilent && micPermissionOk && (
                  <p style={{ color: "red", marginTop: "5px" }}>
                    No sound detected. Please check if your microphone is muted
                    or speak louder.
                  </p>
                )}
              </div>
            )}
          </div>

          <div
            className="device-check-actions"
            style={{ marginTop: "20px" }}>
            <button
              onClick={() =>
                performDeviceCheck(selectedAudioDeviceId, selectedVideoDeviceId)
              }
              className="btn btn-secondary"
              disabled={uploadRecordingMutation.isLoading}>
              Test Devices Again
            </button>
            <button
              onClick={handleProceedFromDeviceCheck}
              className="btn btn-primary"
              disabled={
                !cameraPermissionOk ||
                !micPermissionOk ||
                (isMicrophoneSilent && test?.requiresRecording) ||
                uploadRecordingMutation.isLoading ||
                isEnumeratingDevices
              }
              style={{ marginLeft: "10px" }}>
              {uploadRecordingMutation.isLoading
                ? "Loading..."
                : "Proceed to Test"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-danger"
              style={{ marginLeft: "10px" }}
              disabled={uploadRecordingMutation.isLoading}>
              Exit
            </button>
          </div>
          <p
            className="small-text"
            style={{ marginTop: "15px" }}>
            Ensure you have granted necessary browser permissions for camera and
            microphone.
          </p>
        </div>
      </div>
    );
  }

  // Test data loading and errors, after device check is cleared
  if (testLoading) {
    return <div className="loading-container">Loading test details...</div>;
  }

  // Display general error if one occurred during test operations (like startTest failure)
  // This error state is now primarily for operational errors, not auth/profile issues.
  if (error) {
    return (
      <div
        className="error-container"
        style={{ textAlign: "center", marginTop: "50px", width: "100%" }}>
        {error}
      </div>
    );
  }

  if (testError) {
    // Error from useTest hook
    return (
      <div className="error-container">
        Error loading test data: {testError.message}
      </div>
    );
  }
  if (!test) {
    return (
      <div className="error-container">
        Test data not found. It might still be loading or an issue occurred.
      </div>
    );
  }

  // ... (rest of the rendering logic: prompts, test content) ...
  const canRenderTest = testAttempt || success;
  const isBlockedByPrompts =
    showFullscreenPrompt ||
    (showVideoPrompt && !isRecording && !videoError) ||
    videoPermissionError;

  return (
    <div
      className="exam-container-fullscreen"
      ref={containerRef}>
      {canRenderTest && !success && (
        <div className="sticky-header">
          <div className="test-info">
            <h2>{test?.title || "Test"}</h2>
          </div>
          {remainingTime && (
            <div className="compact-timer">
              <span className="timer-icon">⏱️</span>
              {String(remainingTime.hours).padStart(2, "0")}:
              {String(remainingTime.minutes).padStart(2, "0")}:
              {String(remainingTime.seconds).padStart(2, "0")}
            </div>
          )}
          <div className="violation-counter">
            <span>
              Violations: {violations} / {maxViolations}
            </span>
          </div>
          <button
            className="btn btn-submit btn-submit-header"
            onClick={() => handleSubmitTest()}
            disabled={isSubmitting || !testAttempt}>
            {isSubmitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      )}

      {showFullscreenPrompt && !isFullscreen && (
        <div className="fullscreen-prompt overlay">
          <div className="fullscreen-prompt-content">
            <h2>Fullscreen Required</h2>
            <p>
              This test must be taken in fullscreen mode to prevent
              distractions.
            </p>
            <button
              onClick={requestFullscreen}
              className="btn btn-primary">
              Enter Fullscreen
            </button>
            <p className="small-text">
              Exiting fullscreen during the test will count as a violation.
            </p>
          </div>
        </div>
      )}

      {showVideoPrompt &&
        isFullscreen &&
        !isRecording &&
        !videoError &&
        test?.requiresRecording && (
          <div className="video-prompt overlay">
            <div className="video-prompt-content">
              <h2>Camera & Microphone Access for Recording</h2>
              <p>
                This test requires continuous video and audio recording. Please
                allow access to your camera and microphone for the recording to
                start.
              </p>
              <button
                onClick={startRecording}
                className="btn btn-primary">
                Allow Camera & Mic for Recording
              </button>
              <p className="small-text">
                If you deny permission, or if recording fails to start, you will
                not be able to proceed with the test.
              </p>
            </div>
          </div>
        )}

      {videoPermissionError && (
        <div className="video-prompt overlay">
          <div className="video-prompt-content">
            <h2>Recording Permission Denied</h2>
            <p>
              Camera and microphone access for recording was denied. This is
              required for the test.
            </p>
            <p>
              Please enable permissions in your browser settings and try again.
            </p>
            <button
              onClick={startRecording}
              className="btn btn-primary">
              Try Allowing Recording Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-secondary"
              style={{ marginLeft: "10px" }}>
              Exit Test
            </button>
          </div>
        </div>
      )}

      {/* Display current violation message */}
      {currentViolationMessage && (
        <div className="messages-container-main violation-alert">
          <div
            className="error-message"
            style={{ borderColor: "orange", color: "orange" }}>
            {currentViolationMessage}
          </div>
        </div>
      )}

      {/* Show general operational errors here, not the initial auth/profile error */}
      {(success || (videoError && !videoPermissionError)) && (
        <div className="messages-container-main">
          {success && <div className="success-message">{success}</div>}
          {videoError && !videoPermissionError && (
            <div className="error-message">{videoError}</div>
          )}
        </div>
      )}

      {canRenderTest && !isBlockedByPrompts && !success ? (
        <div className="questions-list-area">
          {test?.questions?.map((question, index) => (
            <div
              key={question.id}
              className="question-item">
              <div className="question-header">
                <span className="question-number">Question {index + 1}</span>
                {question.required && <span className="required-mark">*</span>}
                <span className="question-type">({question.type})</span>
              </div>

              <div className="question-text">
                <p>{question.text}</p>
              </div>

              {question.type === "MCQ" && (
                <div className="mcq-options">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`option ${
                        answers[question.id]?.optionId === option.id
                          ? "selected"
                          : ""
                      }`}>
                      <input
                        type="radio"
                        id={`option-${option.id}`}
                        name={`question-${question.id}`}
                        checked={answers[question.id]?.optionId === option.id}
                        onChange={() =>
                          handleOptionSelect(question.id, option.id)
                        }
                        disabled={isSubmitting}
                      />
                      <label
                        className="option-label"
                        htmlFor={`option-${option.id}`}>
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "CHECKBOX" && (
                <div className="checkbox-options">
                  {question.options.map((option) => (
                    <div
                      key={option.id}
                      className={`option ${
                        answers[question.id]?.selectedOptions?.includes(
                          option.id
                        )
                          ? "selected"
                          : ""
                      }`}>
                      <input
                        type="checkbox"
                        id={`option-${option.id}`}
                        checked={answers[
                          question.id
                        ]?.selectedOptions?.includes(option.id)}
                        onChange={(e) =>
                          handleCheckboxSelect(
                            question.id,
                            option.id,
                            e.target.checked
                          )
                        }
                        disabled={isSubmitting}
                      />
                      <label
                        className="option-label"
                        htmlFor={`option-${option.id}`}>
                        {option.text}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "TEXT" && (
                <div className="text-answer">
                  <textarea
                    placeholder="Type your answer here..."
                    value={answers[question.id]?.textAnswer || ""}
                    onChange={(e) =>
                      handleTextAnswer(question.id, e.target.value)
                    }
                    disabled={isSubmitting}></textarea>
                </div>
              )}

              {question.type === "CODING" && (
                <div className="coding-question-container">
                  <div className="coding-info">
                    <p>
                      <strong>Language:</strong>{" "}
                      {question.programmingLanguage || "N/A"}
                    </p>
                    <div>
                      <strong>Starter Code:</strong>
                      <pre className="code-block starter-code-block">
                        {question.starterCode || "// No starter code provided."}
                      </pre>
                    </div>
                  </div>

                  {question.testCases?.filter((tc) => tc.visible).length >
                    0 && (
                    <div className="sample-test-cases">
                      <strong>Sample Test Cases:</strong>
                      <table className="test-cases-table-student">
                        <thead>
                          <tr>
                            <th>Input</th>
                            <th>Expected Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          {question.testCases
                            .filter((tc) => tc.visible)
                            .map((testCase, idx) => (
                              <tr key={testCase.id || `tc-${idx}`}>
                                <td>
                                  <pre>{testCase.input}</pre>
                                </td>
                                <td>
                                  <pre>{testCase.expectedOutput}</pre>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="coding-answer">
                    <label
                      htmlFor={`code-answer-${question.id}`}
                      className="code-editor-label">
                      Your Code:
                    </label>
                    <textarea
                      id={`code-answer-${question.id}`}
                      className="code-editor code-textarea"
                      placeholder="Write your code here..."
                      value={answers[question.id]?.codeAnswer ?? ""}
                      onChange={(e) =>
                        handleCodeAnswer(question.id, e.target.value)
                      }
                      disabled={isSubmitting}></textarea>
                  </div>

                  <p className="hidden-test-case-note">
                    <em>
                      Note: Your code will be evaluated against additional
                      hidden test cases.
                    </em>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        !success &&
        !videoPermissionError &&
        !showFullscreenPrompt &&
        !showVideoPrompt && (
          <div className="loading-container">
            <p>Preparing your test environment...</p>
          </div>
        )
      )}
    </div>
  );
};

export default StudentTest;
