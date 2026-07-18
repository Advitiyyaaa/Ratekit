import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AlgorithmListPage } from './pages/AlgorithmListPage';
import { AlgorithmDetailPage } from './pages/AlgorithmDetailPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { DocsPage } from './pages/DocsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/algorithms" element={<AlgorithmListPage />} />
          <Route path="/algorithms/:slug" element={<AlgorithmDetailPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/docs/:slug" element={<DocsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
