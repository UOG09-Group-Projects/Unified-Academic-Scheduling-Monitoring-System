import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Institution from './pages/Institution';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/institutions" element={<Institution />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;