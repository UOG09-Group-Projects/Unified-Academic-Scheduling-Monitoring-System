import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Institution from './pages/Institution';
import BatchManagement from "./pages/BatchManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/institutions" element={<Institution />} />
        <Route path="/batches" element={<BatchManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;