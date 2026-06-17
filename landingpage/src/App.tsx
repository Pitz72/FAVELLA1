import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

// Importa le nuove pagine
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import UpdatesPage from './pages/UpdatesPage';
import ManualPage from './pages/ManualPage';
import CoursePage from './pages/CoursePage';
import CollaboratePage from './pages/CollaboratePage';
import ProgramPage from './pages/ProgramPage';
import GalleryPage from './pages/GalleryPage';
import LibraryPage from './pages/LibraryPage';


function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0); // Scroll to top on page change
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (route) {
      case '#/progetto':
        return <ProjectPage />;
      case '#/aggiornamenti':
        return <UpdatesPage />;
      case '#/manuale':
        return <ManualPage />;
      case '#/libreria':
        return <LibraryPage />;
      case '#/collabora':
        return <CollaboratePage />;
      case '#/':
      default:
        return <HomePage />;
    }
  };

  // Il «Manuale interattivo» è un'esperienza immersiva: la chrome del sito
  // sparisce e il monitor diventa il protagonista della schermata.
  if (route === '#/corso') {
    return (
      <div className="min-h-screen bg-favella-void font-sans text-favella-text-primary">
        <CoursePage />
      </div>
    );
  }

  // «Programma con FAVELLA 1» è il laboratorio: come il corso, è un'esperienza
  // a tutto schermo — niente sidebar, l'editor e il terminale sono i protagonisti.
  if (route === '#/programma') {
    return (
      <div className="min-h-screen bg-favella-void font-sans text-favella-text-primary">
        <ProgramPage />
      </div>
    );
  }

  // La «Galleria ufficiale» è immersiva come il corso: il monitor con la storia
  // giocabile è il protagonista, la chrome del sito sparisce.
  if (route === '#/galleria') {
    return (
      <div className="min-h-screen bg-favella-void font-sans text-favella-text-primary">
        <GalleryPage />
      </div>
    );
  }

  return (
    <div className="bg-favella-dark font-sans text-favella-text-primary">
      <Header />
      <main className="ml-0 md:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8 lg:p-12 min-h-[calc(100vh-5rem)]">
          {renderPage()}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default App;