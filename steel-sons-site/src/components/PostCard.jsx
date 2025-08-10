import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';

// The following global variables are provided by the canvas environment.
// DO NOT MODIFY them.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Get or create a client ID for this user/device
const getClientId = () => {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = uuidv4();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
};

// Main App component
const App = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [clientId] = useState(getClientId());

  // Use useEffect to handle authentication and data fetching
  useEffect(() => {
    const authenticateAndListen = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          // If no custom token, user is anonymous for this session
          setLoading(false);
          setError("Error: Initial auth token is missing.");
          return;
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            setUserId(user.uid);
            const q = collection(db, `artifacts/${appId}/public/data/messages`);
            const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
              const fetchedMessages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate(),
              }));
              // Sort messages by timestamp
              fetchedMessages.sort((a, b) => a.timestamp - b.timestamp);
              setMessages(fetchedMessages);
              setLoading(false);
            }, (err) => {
              console.error("Firestore snapshot error:", err);
              setError("Failed to load messages.");
              setLoading(false);
            });

            return () => unsubscribeSnapshot();
          } else {
            console.log("User is signed out");
            setUserId(null);
            setLoading(false);
            setMessages([]);
          }
        });

        return () => unsubscribeAuth();
      } catch (err) {
        console.error("Authentication or setup error:", err);
        setError("Failed to set up the chat app.");
        setLoading(false);
      }
    };

    authenticateAndListen();
  }, []);

  // Handler for sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !userId) return;

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/messages`), {
        text: newMessage,
        userId: userId,
        clientId: clientId, // Add the client ID to the post
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Failed to send message.");
    }
  };

  // Handler for deleting a message
  const handleDeleteMessage = async (messageId, messageClientId) => {
    if (messageClientId !== clientId) {
      console.error("Permission denied: You can only delete your own messages.");
      return;
    }
    
    // Add a simple confirmation before deleting
    if (!window.confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/messages`, messageId));
    } catch (err) {
      console.error("Error deleting document: ", err);
      setError("Failed to delete message.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl animate-pulse">Loading chat...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400 p-4">
        <div className="text-xl text-center">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-inter">
      <header className="p-4 bg-gray-800 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
          Group Chat
        </h1>
        <span className="text-sm text-gray-400">
          Your User ID: <span className="font-mono text-xs">{clientId}</span>
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start rounded-lg p-3 shadow-lg ${
              message.clientId === clientId
                ? 'bg-blue-600 ml-auto'
                : 'bg-gray-700 mr-auto'
            } max-w-sm`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-300">
                {message.clientId === clientId ? 'You' : message.clientId.substring(0, 8)}
              </p>
              <p className="mt-1">{message.text}</p>
              <span className="block text-xs text-right text-gray-400 mt-2">
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '...'}
              </span>
            </div>
            {message.clientId === clientId && (
              <button
                onClick={() => handleDeleteMessage(message.id, message.clientId)}
                className="ml-3 text-red-400 hover:text-red-300 p-1 rounded-full transition-colors duration-200"
                title="Delete your post"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-gray-800 shadow-md flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-3 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="p-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-r-lg hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default App;
