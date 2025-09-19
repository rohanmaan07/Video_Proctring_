// src/components/InterviewDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportDocument from './ReportDocument';
import api from '../util/axios'; 

const InterviewDetail = () => {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/api/interview/${id}`);
        setInterview(res.data);
      } catch (err) {
        setError('Could not fetch the report.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-500";
  };

  if (loading) return <div className="min-h-screen bg-[#0b1220] text-white flex justify-center items-center text-xl">Loading Report...</div>;
  if (error) return <div className="min-h-screen bg-[#0b1220] text-white flex justify-center items-center text-xl text-red-400">{error}</div>;
  if (!interview) return <div className="min-h-screen bg-[#0b1220] text-white flex justify-center items-center text-xl">No report data found.</div>;

  const logs = Array.isArray(interview.logs) ? interview.logs : [];

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-8">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Proctoring Report</h1>
        <div className="mt-2 text-xl text-gray-400">
          Candidate: 
          <span className="ml-2 px-4 py-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full font-semibold shadow-lg text-white">
            {interview.candidateName}
          </span>
        </div>
      </div>


      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#071127] p-6 rounded-xl shadow-xl text-center border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-300">Final Integrity Score</h3>
          <p className={`text-6xl font-bold ${getScoreColor(interview.integrityScore)}`}>
            {interview.integrityScore}
          </p>
          <p className="text-lg text-gray-400 mt-1">/ 100</p>
        </div>

        <div className="bg-[#071127] p-6 rounded-xl shadow-xl text-center border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-300">Interview Duration</h3>
          <p className="text-4xl font-bold text-blue-400">{interview.duration}</p>
        </div>

        <div className="bg-[#071127] p-6 rounded-xl shadow-xl text-center border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-gray-300">Focus Lost Events</h3>
          <p className="text-4xl font-bold text-yellow-400">{interview.focusLostCount}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-[#071127] p-6 rounded-xl shadow-xl border border-gray-700 mb-6">
        <h3 className="text-xl font-semibold mb-4">Score Breakdown</h3>
        <ul className="space-y-2 text-gray-300">
          {interview.deductions && interview.deductions.length > 0 ? (
            interview.deductions.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b border-gray-700 pb-2">
                <span>{item.event}</span>
                <span className="text-red-400">{item.points}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-400">No score deductions. Perfect integrity!</li>
          )}
        </ul>
      </div>

      {/* Video & Logs */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#071127] p-4 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Recorded Video</h3>
          {interview.recordingUrl ? (
            <video src={interview.recordingUrl} controls className="w-full rounded-lg shadow-inner border border-gray-600"></video>
          ) : (
            <p className="text-gray-400">Video not recorded or still processing.</p>
          )}
        </div>

        <div className="md:col-span-1 bg-[#071127] p-4 rounded-xl border border-gray-700 shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Suspicious Events Log</h3>
          <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
            <ul className="text-sm space-y-2">
              {logs.length === 0 ? (
                <li className="text-gray-400">No suspicious events were detected.</li>
              ) : (
                logs.map((log) => (
                  <li key={log._id} className="p-2 bg-gray-800 rounded hover:bg-gray-700 transition">
                    <span className="font-mono text-gray-300">{new Date(log.timestamp).toLocaleTimeString()}</span>: 
                    <span className="ml-2 text-yellow-300">{log.eventType}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center mt-8">
        <PDFDownloadLink
          document={<ReportDocument interview={interview} />}
          fileName={`proctoring-report-${interview?.candidateName || "candidate"}-${id}.pdf`}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition"
        >
          {({ loading }) => (loading ? 'Generating PDF...' : 'Download Report as PDF')}
        </PDFDownloadLink>
      </div>
    </div>
  );
};

export default InterviewDetail;
