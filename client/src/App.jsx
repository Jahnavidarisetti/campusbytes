import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_API_URL);

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Fetch initial feed
    axios.get(`${import.meta.env.VITE_API_URL}/api/posts`)
      .then(res => setPosts(res.data));

    // Listen for real-time updates
    socket.on('display_post', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">CampusBytes Feed</h1>
      <div className="grid gap-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <h2 className="font-bold text-lg">{post.club_name}</h2>
            <p className="text-gray-600 mt-2">{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;