import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Submission, Contact } from '@prisma/client';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#333333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingBottom: 20,
  },
  titleCol: {
    width: '50%',
  },
  profileCol: {
    width: '50%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  observationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  label: {
    fontWeight: 'bold',
    color: '#555555',
  },
  value: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  guidanceBox: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  guidanceText: {
    fontSize: 13,
    lineHeight: 1.5,
  }
});

type ReportData = Submission & { contact: Contact };

export const ReportDocument = ({ data }: { data: ReportData }) => {
  const guidanceText = data.totalScore < 15 
    ? "We recommend discussing these results with a healthcare professional."
    : "Your child is showing strong signs of early communication development. Keep engaging in verbal play!";

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>Language Check-In</Text>
            <Text style={styles.subtitle}>Assessment Report</Text>
          </View>
          <View style={styles.profileCol}>
            <Text style={styles.label}>Child Profile</Text>
            <Text>{data.contact.parentName}'s Child</Text>
            <Text>DoB: {new Date(data.contact.childDoB).toLocaleDateString()}</Text>
            <Text style={{ marginTop: 8, color: '#666' }}>{new Date(data.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Observations</Text>
          
          <View style={styles.observationRow}>
            <Text style={styles.label}>Cumulative Score</Text>
            <Text style={styles.value}>{data.totalScore} Points</Text>
          </View>
          
          <View style={styles.observationRow}>
            <Text style={styles.label}>Assessment Path</Text>
            <Text style={styles.value}>{data.tag}</Text>
          </View>

          {data.finalTag && (
            <View style={styles.observationRow}>
              <Text style={styles.label}>Final Result Tag</Text>
              <Text style={styles.value}>{data.finalTag}</Text>
            </View>
          )}
        </View>

        <View style={styles.guidanceBox}>
          <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Guidance</Text>
          <Text style={styles.guidanceText}>{guidanceText}</Text>
        </View>
      </Page>
    </Document>
  );
};
