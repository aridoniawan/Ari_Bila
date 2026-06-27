import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import TodoList from './pages/TodoList';
import Guests from './pages/Guests';
import Tabungan from './pages/Tabungan';
import Seserahan from './pages/Seserahan';
import Celebration from './components/Celebration';

function App() {
  return (
    <Router>
      <Celebration />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/todo" element={<TodoList />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/tabungan" element={<Tabungan />} />
            <Route path="/seserahan" element={<Seserahan />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
