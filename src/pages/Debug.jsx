import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const Debug = () => {
    const [apiTest, setApiTest] = useState('Testing...');
    const [firebaseConfig, setFirebaseConfig] = useState({});

    useEffect(() => {
        // Test API connectivity
        fetch(`${API_BASE_URL}/health`)
            .then(res => res.json())
            .then(data => setApiTest(JSON.stringify(data, null, 2)))
            .catch(err => setApiTest(`Error: ${err.message}`));

        // Display Firebase config (without sensitive data)
        setFirebaseConfig({
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'Set' : 'Missing',
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'Set' : 'Missing',
            appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'Set' : 'Missing'
        });
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Debug Information</h1>

            <h2>Environment Variables</h2>
            <ul>
                <li>VITE_API_BASE_URL: {API_BASE_URL}</li>
                <li>VITE_FIREBASE_API_KEY: {firebaseConfig.apiKey}</li>
                <li>VITE_FIREBASE_AUTH_DOMAIN: {firebaseConfig.authDomain}</li>
                <li>VITE_FIREBASE_PROJECT_ID: {firebaseConfig.projectId}</li>
                <li>VITE_FIREBASE_STORAGE_BUCKET: {firebaseConfig.storageBucket}</li>
                <li>VITE_FIREBASE_MESSAGING_SENDER_ID: {firebaseConfig.messagingSenderId}</li>
                <li>VITE_FIREBASE_APP_ID: {firebaseConfig.appId}</li>
            </ul>

            <h2>API Test (/health endpoint)</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {apiTest}
            </pre>

            <h2>Current URL</h2>
            <p>{window.location.href}</p>

            <h2>Local Storage</h2>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                {JSON.stringify(Object.keys(localStorage), null, 2)}
            </pre>
        </div>
    );
};

export default Debug;
