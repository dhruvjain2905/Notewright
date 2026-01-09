import Dashboard from '../components/navbar.jsx'
import CreateConceptPage from '../components/concept.jsx'
import {Routes, Route, Navigate} from "react-router-dom"
import ConceptViewer from '../components/viewer.jsx'
import NotewrightSignUp from '../components/signup.jsx'
import NotewrightLogin from '../components/login.jsx'
import SettingsPage from '../components/settings.jsx'

function App() {

  return <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home/*" element={<Dashboard />} />
            <Route path="/new/*" element={<CreateConceptPage />} />
            <Route path="viewer/*" element={<ConceptViewer />} />
            <Route path="/signup/*" element={<NotewrightSignUp />} />
            <Route path="/login/*" element={<NotewrightLogin />} />
            <Route path="/settings/*" element={<SettingsPage />} />
        </Routes>

}

export default App
