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
import StudioPage from './pages/StudioPage';
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
      case '/studio':
        return <StudioPage />;
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

  return (
    <div className="flex min-h-screen flex-col bg-favella-void font-sans text-favella-text-primary">
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CookieBanner />
    </div>
  );
}

export default App;