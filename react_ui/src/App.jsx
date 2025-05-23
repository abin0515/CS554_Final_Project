import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import './App.css';

// Import Components
import Layout from './components/Layout';
import PostList from './components/post/PostList';
import PostDetail from './components/post/PostDetail';
import CreatePost from './components/post/CreatePost';
import EditPost from './components/post/EditPost';
import UserProfile from './components/UserProfile';
import Chatbot from './components/Chatbot/Chatbot';
import ChatComponent from './components/ChatComponent';

function App() {
  return (
    <Router>
      <Chatbot />
      <Routes>
        {/* Route defining the main layout */}
        <Route path="/" element={<Layout />}>
          {/* Child routes rendered within the Layout's <Outlet /> */}
          
          {/* Index route for the default view at '/' */}
          <Route index element={<PostList />} /> 
          
          {/* Route for post details */}
          <Route path="posts/detail" element={<PostDetail />} />
          
          {/* Add route for creating posts */}
          <Route path="posts/create" element={<CreatePost />} />
          
          {/* Add route for editing posts */}
          <Route path="posts/edit" element={<EditPost />} />

          {/* Add route for profile page */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />

          {/*adding route for chatroom*/}
          <Route path="/chat/:userId" element={<ChatComponent />} />
          
          {/* Add other routes that should use the Layout here */}
          {/* Example: <Route path="profile" element={<UserProfile />} /> */}
        </Route>

        {/* Routes outside the main layout (optional) */}
        {/* Example: <Route path="/login" element={<LoginPage />} /> */}
        {/* Example: <Route path="*" element={<NotFound />} /> */}
        
      </Routes>
    </Router>
  );
}

export default App;
