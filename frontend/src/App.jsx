
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Institution from './pages/Institution';
import BatchManagement from "./pages/BatchManagement";
import EducatorManagement from './pages/EducatorManagement'
import Course from './pages/Course';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/institutions" element={<Institution />} />
        <Route path="/batches" element={<BatchManagement />} />
        <Route path="/courses" element={<Course />} />
        <Route path="/educators" element={<EducatorManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

