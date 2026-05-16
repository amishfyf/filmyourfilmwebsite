import { useState } from 'react';
import HorizontalScroll from './components/HorizontalScroll';
import VideoModal from './components/VideoModal';
import './App.css';

function App() {
  const [activeProject, setActiveProject] = useState(null);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="site-logo" href="#home">
          Creatiwe* <span>Studio</span>
        </a>
        <nav className="site-nav">
          <a href="#home">Home</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="site-main">
        <HorizontalScroll onSelectProject={setActiveProject} />
      </main>

      <VideoModal project={activeProject} onClose={() => setActiveProject(null)} />
    </div>
  );
}

export default App;
