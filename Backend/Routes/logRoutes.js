const express = require("express");
const router = express.Router();
const Log = require("../Models/log");
const upload = require("../Middlewares/multer");
const cloudinary = require("../cloudinary");
const Interview = require("../Models/Interview");

// --- API 1: Naya Interview Start Karein ---
router.post("/interview/start", async (req, res) => {
  try {
    const { candidateName } = req.body;
    const newInterview = new Interview({ candidateName });
    await newInterview.save();
    // Frontend ko naye interview ki ID bhejein
    res.status(201).json(newInterview);
  } catch (err) {
    console.error("Error starting interview:", err.message);
    res.status(500).send("Server Error");
  }
});
// --- API 2: Event ko Log karein (Updated) ---
router.post("/log", async (req, res) => {
  try {
    const { eventType, interviewId } = req.body;
    if (!eventType || !interviewId) {
      return res
        .status(400)
        .json({ msg: "Event type and interviewId are required" });
    }

    const newLog = new Log({ eventType, interview: interviewId });
    await newLog.save();

    await Interview.findByIdAndUpdate(interviewId, {
      $push: { logs: newLog._id },
    });

    res.status(201).json(newLog);
  } catch (err) {
    console.error("Error in /api/log:", err.message);
    res.status(500).send("Server Error");
  }
});

// --- API 3: Video Upload
router.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    // Ab frontend se interviewId bhi aayega
    const { interviewId } = req.body;
    if (!req.file || !interviewId) {
      return res.status(400).json({ msg: "No video file or interviewId" });
    }

    cloudinary.uploader
      .upload_stream(
        { resource_type: "video", folder: "proctoring_videos" },
        async (error, result) => {
          if (error) {
            return res
              .status(500)
              .json({ msg: "Error uploading to Cloudinary" });
          }

          await Interview.findByIdAndUpdate(interviewId, {
            recordingUrl: result.secure_url,
            endTime: Date.now(),
          });

          res.status(201).json({ url: result.secure_url });
        }
      )
      .end(req.file.buffer);
  } catch (err) {
    console.error("Error in /api/upload-video:", err.message);
    res.status(500).send("Server Error");
  }
});
// --- API 4: Admin ke liye saare Interviws
router.get("/interviews", async (req, res) => {
  try {
    const interviews = await Interview.find().sort({ startTime: -1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- API 5: Interview Detail with Score Breakdown ---
router.get("/interview/:id", async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id).populate("logs");
    if (!interview) {
      return res.status(404).json({ msg: "Interview not found" });
    }

    let duration = "In Progress";
    if (interview.endTime) {
      const durationInMs =
        new Date(interview.endTime).getTime() -
        new Date(interview.startTime).getTime();
      const minutes = Math.floor(durationInMs / 60000);
      const seconds = ((durationInMs % 60000) / 1000).toFixed(0);
      duration = `${minutes}m ${seconds}s`;
    }

    const focusLostCount = interview.logs.filter(
      (log) =>
        log.eventType.includes("LOOKING_AWAY") ||
        log.eventType.includes("NO_FACE")
    ).length;

    let integrityScore = 100;
    let deductions = [];

    interview.logs.forEach((log) => {
      let points = 0;

      if (log.eventType.includes("PHONE_DETECTED")) points = 7;
      else if (log.eventType.includes("BOOK_DETECTED")) points = 5;
      else if (log.eventType.includes("LOOKING_AWAY")) points = 2;
      else if (log.eventType.includes("NO_FACE_DETECTED")) points = 5;
      else if (log.eventType.includes("MULTIPLE_FACES_DETECTED")) points = 10;
      else if (log.eventType.includes("DROWSINESS_DETECTED")) points = 5;
      else if (log.eventType.includes("BACKGROUND_VOICE")) points = 3;
      else if (log.eventType.includes("EXTRA_DEVICE_DETECTED")) points = 8;

      if (points > 0) {
        integrityScore -= points;
        deductions.push({ event: log.eventType, points: -points });
      }
    });

    if (integrityScore < 0) integrityScore = 0;
    res.json({
      ...interview.toObject(),
      duration,
      focusLostCount,
      integrityScore,
      deductions,
    });
  } catch (err) {
    console.error("Error in /api/interview/:id", err.message);
    res.status(500).send("Server Error");
  }
});

// --- API 6: Delete an Interview (Admin) ---
router.delete("/interview/:id", async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ msg: "Interview not found" });
    await Log.deleteMany({ interview: interview._id });

    await Interview.findByIdAndDelete(req.params.id);

    res.json({ msg: "Interview deleted successfully" });
  } catch (err) {
    console.error("Error deleting interview:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
