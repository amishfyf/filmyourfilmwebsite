import { useState } from 'react';
import AdminPage from './components/AdminPage';
import HorizontalScroll from './components/HorizontalScroll';
import VideoModal from './components/VideoModal';
import './App.css';

const getNormalizedPath = () => {
  const pathname = window.location.pathname.replace(/\/+$/, '');
  return pathname || '/';
};

function App() {
  const isAdminRoute = getNormalizedPath().toLowerCase() === '/admin';
  const [activeProject, setActiveProject] = useState(null);

  if (isAdminRoute) {
    return <AdminPage />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="site-logo" href="#home">
          <img
            alt="Creatiwe Studio"
            className="site-logo-mark"
            src="https://cdn.prod.website-files.com/64d4cabf6efb73a26f743da1/6721fa0cfcccdb249886dfa3_Animation.gif"
          />
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
