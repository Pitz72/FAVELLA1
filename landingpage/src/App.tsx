import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { useRoute } from './router';

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
import DownloadsPage from './pages/DownloadsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiePage from './pages/CookiePage';


function App() {
  const route = useRoute();

  const renderPage = () => {
    switch (route) {
      case '/progetto':
        return <ProjectPage />;
      case '/aggiornamenti':
        return <UpdatesPage />;
      case '/manuale':
        return <ManualPage />;
      case '/corso':
        return <CoursePage />;
      case '/programma':
        return <ProgramPage />;
      case '/galleria':
        return <GalleryPage />;
      case '/libreria':
        return <LibraryPage />;
      case '/download':
        return <DownloadsPage />;
      case '/privacy':
        return <PrivacyPage />;
      case '/cookie':
        return <CookiePage />;
      case '/collabora':
        return <CollaboratePage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  // Layout del redesign: nav orizzontale sticky in alto, contenuto a tutta
  // larghezza. Le pagine MIGRATE al redesign sono «full-bleed» (sezioni coi
  // propri gradienti radiali, padding interno); le altre restano nel
  // contenitore con padding finché non sono migrate. Aggiungere le rotte a
  // FULL_BLEED man mano che vengono ristilizzate.
  const FULL_BLEED = new Set(["/", "/progetto", "/aggiornamenti", "/manuale", "/corso", "/programma", "/galleria", "/libreria", "/download", "/collabora"]);
  const fullBleed = FULL_BLEED.has(route);

  return (
    <div className="flex min-h-screen flex-col bg-favella-void font-sans text-favella-text-primary">
      <Header />
      <main className="flex-1">
        {fullBleed ? (
          renderPage()
        ) : (
          <div className="mx-auto min-h-[calc(100vh-12rem)] max-w-6xl px-4 py-10 md:px-8 md:py-14">
            {renderPage()}
          </div>
        )}
      </main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

export default App;