import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { Share2, MessageCircle, Heart, PlusCircle, Search } from 'lucide-react';

// Use the environment variable you set in Vercel
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function App() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    // 1. Fetch existing posts
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    fetchPosts();

    // 2. Listen for real-time posts
    socket.on('display_post', (newPost) => {
      setPosts((prev) => [newPost, ...prev]);
    });

    return () => socket.off('display_post');
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content || !clubName) return;

    const newPost = { club_name: clubName, content, created_at: new Date() };
    
    // Emit to socket so everyone sees it instantly
    socket.emit('new_post', newPost);
    
    // Reset form
    setContent('');
    setClubName('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">CampusBytes</h1>
          <div className="relative w-64">
            <input type="text" placeholder="Search clubs..." className="w-full bg-gray-100 rounded-full py-1.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <Search className="absolute left-3 top-2 text-gray-400" size={18} />
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-8 px-4">
        {/* Admin Post Box */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <PlusCircle className="text-blue-500" />
            <h2 className="font-semibold text-gray-700">Post an Update</h2>
          </div>
          <input 
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="Club Name (e.g., Coding Club)" 
            className="w-full mb-2 p-2 border-b focus:outline-none"
          />
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening on campus?" 
            className="w-full p-2 h-24 resize-none focus:outline-none"
          ></textarea>
          <button 
            onClick={handlePost}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Post to Feed
          </button>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-blue-600 uppercase text-xs tracking-wider">{post.club_name}</span>
                  <span className="text-gray-400 text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-800 text-lg leading-relaxed">{post.content}</p>
              </div>
              <div className="border-t px-4 py-2 flex justify-between text-gray-500">
                <button className="flex items-center space-x-1 hover:text-red-500 transition"><Heart size={20}/> <span>Like</span></button>
                <button className="flex items-center space-x-1 hover:text-blue-500 transition"><MessageCircle size={20}/> <span>Comment</span></button>
                <button className="flex items-center space-x-1 hover:text-green-500 transition"><Share2 size={20}/> <span>Share</span></button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;