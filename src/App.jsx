import { HashRouter, Routes, Route } from 'react-router-dom'
import Homepage from './components/Homepage'
import ProssimaStagione from './components/ProssimaStagione'
import Analytics from './components/Analytics'
import AlzareIlLivello from './components/AlzareIlLivello'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/prossima-stagione" element={<ProssimaStagione />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alzare-il-livello" element={<AlzareIlLivello />} />
      </Routes>
    </HashRouter>
  )
}
