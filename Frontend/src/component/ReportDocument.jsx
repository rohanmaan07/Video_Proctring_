import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/helvetica-font@1.0.0/dist/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/helvetica-font@1.0.0/dist/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 30 },
  title: { fontSize: 24, marginBottom: 10, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: 'grey' },
  section: { marginBottom: 20, border: '1px solid #EEEEEE', borderRadius: 5, padding: 15 },
  sectionTitle: { fontSize: 16, marginBottom: 15, fontWeight: 'bold', color: '#333333' },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: { width: '30%', textAlign: 'center' },
  summaryValue: { fontSize: 28, fontWeight: 'bold' },
  summaryLabel: { fontSize: 10, color: 'grey', marginTop: 5 },
  logEntry: { fontSize: 10, marginBottom: 5, borderBottom: '1px solid #F5F5F5', paddingBottom: 5 },
  logTime: { fontWeight: 'bold' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, fontSize: 10 },
  breakdownEvent: { color: '#333333' },
  breakdownPoints: { color: '#DC3545', fontWeight: 'bold' },
});

const ReportDocument = ({ interview }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return '#28A745';
    if (score >= 50) return '#FFC107'; 
    return '#DC3545'; 
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Proctoring Report</Text>
          <Text style={styles.subtitle}>Candidate: {interview.candidateName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interview Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryBox}>
              <Text style={{...styles.summaryValue, color: getScoreColor(interview.integrityScore)}}>
                {interview.integrityScore} / 100
              </Text>
              <Text style={styles.summaryLabel}>Integrity Score</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={{...styles.summaryValue, color: '#4A90E2'}}>
                {interview.duration}
              </Text>
              <Text style={styles.summaryLabel}>Interview Duration</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={{...styles.summaryValue, color: '#F5A623'}}>
                {interview.focusLostCount}
              </Text>
              <Text style={styles.summaryLabel}>Focus Lost Events</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          {interview.deductions && interview.deductions.length > 0 ? (
            interview.deductions.map((item, idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={styles.breakdownEvent}>{item.event}</Text>
                <Text style={styles.breakdownPoints}>{item.points}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.breakdownEvent}>No score deductions. Perfect integrity!</Text>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suspicious Events Log</Text>
          {interview.logs.length > 0 ? (
            interview.logs.map((log) => (
              <Text key={log._id} style={styles.logEntry}>
                <Text style={styles.logTime}>{`[${new Date(log.timestamp).toLocaleString()}]`}</Text>
                {` - ${log.eventType}`}
              </Text>
            ))
          ) : (
            <Text style={styles.logEntry}>No suspicious events were detected.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default ReportDocument;
