import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db, storage } from '../lib/firebase';

interface TestResult {
  service: string;
  status: 'testing' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function FirebaseConnectionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (service: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => [...prev, { service, status, message, details }]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Firebase App Initialization
    try {
      addTestResult('Firebase App', 'testing', 'Testing Firebase app initialization...');
      if (db && auth && storage) {
        addTestResult('Firebase App', 'success', 'Firebase app initialized successfully');
      } else {
        addTestResult('Firebase App', 'error', 'Firebase app initialization failed');
      }
    } catch (error) {
      addTestResult('Firebase App', 'error', 'Firebase app initialization error', error.message);
    }

    // Test 2: Firestore Connection
    try {
      addTestResult('Firestore', 'testing', 'Testing Firestore connection...');
      const testCollection = collection(db, 'test');
      const testDoc = await addDoc(testCollection, {
        message: 'Firebase connection test',
        timestamp: new Date().toISOString(),
      });
      
      // Clean up test document
      await deleteDoc(doc(db, 'test', testDoc.id));
      
      addTestResult('Firestore', 'success', 'Firestore connection successful');
    } catch (error) {
      addTestResult('Firestore', 'error', 'Firestore connection failed', error.message);
    }

    // Test 3: Firestore Read/Write
    try {
      addTestResult('Firestore R/W', 'testing', 'Testing Firestore read/write operations...');
      
      // Write test data
      const testCollection = collection(db, 'connection_test');
      const testDoc = await addDoc(testCollection, {
        testId: 'connection-test-' + Date.now(),
        message: 'This is a test document',
        createdAt: new Date(),
      });

      // Read test data
      const querySnapshot = await getDocs(testCollection);
      const testData = querySnapshot.docs.find(doc => doc.id === testDoc.id);
      
      if (testData) {
        addTestResult('Firestore R/W', 'success', 'Firestore read/write operations successful');
      } else {
        addTestResult('Firestore R/W', 'error', 'Could not read written data');
      }

      // Clean up
      await deleteDoc(doc(db, 'connection_test', testDoc.id));
    } catch (error) {
      addTestResult('Firestore R/W', 'error', 'Firestore read/write operations failed', error.message);
    }

    // Test 4: Firebase Auth (Anonymous)
    try {
      addTestResult('Firebase Auth', 'testing', 'Testing Firebase Authentication...');
      
      // Test auth service availability
      if (auth) {
        addTestResult('Firebase Auth', 'success', 'Firebase Authentication service available');
      } else {
        addTestResult('Firebase Auth', 'error', 'Firebase Authentication service not available');
      }
    } catch (error) {
      addTestResult('Firebase Auth', 'error', 'Firebase Authentication test failed', error.message);
    }

    // Test 5: Firebase Storage
    try {
      addTestResult('Firebase Storage', 'testing', 'Testing Firebase Storage...');
      
      if (storage) {
        addTestResult('Firebase Storage', 'success', 'Firebase Storage service available');
      } else {
        addTestResult('Firebase Storage', 'error', 'Firebase Storage service not available');
      }
    } catch (error) {
      addTestResult('Firebase Storage', 'error', 'Firebase Storage test failed', error.message);
    }

    // Test 6: Contacts Collection
    try {
      addTestResult('Contacts Collection', 'testing', 'Testing contacts collection access...');
      
      const contactsCollection = collection(db, 'contacts');
      const contactsSnapshot = await getDocs(contactsCollection);
      
      addTestResult('Contacts Collection', 'success', `Contacts collection accessible (${contactsSnapshot.docs.length} documents)`);
    } catch (error) {
      addTestResult('Contacts Collection', 'error', 'Contacts collection access failed', error.message);
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return '#FFA500';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? 'Running Tests...' : 'Run Firebase Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
                <Text style={styles.resultService}>{result.service}</Text>
                <Text style={[styles.resultStatus, { color: getStatusColor(result.status) }]}>
                  {result.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <Text style={styles.resultDetails}>{result.details}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>What This Test Checks:</Text>
        <Text style={styles.infoText}>• Firebase app initialization</Text>
        <Text style={styles.infoText}>• Firestore database connection</Text>
        <Text style={styles.infoText}>• Firestore read/write operations</Text>
        <Text style={styles.infoText}>• Firebase Authentication service</Text>
        <Text style={styles.infoText}>• Firebase Storage service</Text>
        <Text style={styles.infoText}>• Contacts collection access</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultService: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#1a1a1a',
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultMessage: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 5,
  },
  resultDetails: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 5,
  },
});
