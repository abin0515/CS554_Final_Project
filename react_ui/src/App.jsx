import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Header Area */}
        <div className="app-header">
          Header Area
        </div>

        <div className="app-body">
          {/* Sidebar */}
          <div className="app-sidebar">
            Sidebar Area
          </div>

          {/* Main Content */}
          <div className="app-main">
            <div className="app-tabs">
              Tabs Area
            </div>
            <div className="app-content">
              Main Content Area (e.g., Post List or Blog Display)
            </div>
          </div>

          {/* Right Panel */}
          <div className="app-right">
            Right Side Area (e.g., Trending or Recommended)
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
