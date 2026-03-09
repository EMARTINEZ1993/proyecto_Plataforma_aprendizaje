import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login, { AuthContext, AuthProvider } from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import MatrixRain from './components/MatrixRain';
import Navigation from './components/Navigation';
import Quiz from './components/Quiz';
import Shop from './components/Shop';
import Stats from './components/Stats';
import Footer from './components/Footer';
import { api } from './utils/api';
import './App.css'; 

const MainLayout = () => {
    const { user, token, logout, updateUser } = useContext(AuthContext);
    const [theme, setTheme] = useState('default');
    const [matrixUnlocked, setMatrixUnlocked] = useState(false);
    const themeStorageKey = user ? `mlQuizTheme_user_${user.id}` : null;

    useEffect(() => {
        if (!themeStorageKey) {
            setTheme('default');
            return;
        }

        const userTheme = localStorage.getItem(themeStorageKey);
        setTheme(userTheme || 'default');
    }, [themeStorageKey]);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
        if (themeStorageKey) {
            localStorage.setItem(themeStorageKey, theme);
        }
    }, [theme, themeStorageKey]);

    useEffect(() => {
        const fetchOwnedItems = async () => {
            setMatrixUnlocked(false);
            if (!user || user.role !== 'student') return;
            try {
                const authToken = localStorage.getItem('token') || token;
                if (!authToken) return;
                const res = await api.get('/api/shop/items', {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                setMatrixUnlocked(res.data.includes('theme_matrix'));
            } catch (error) {
                console.error('Error loading owned items in layout:', error);
            }
        };

        fetchOwnedItems();
    }, [user, token]);

    const handleEquipTheme = (newTheme) => {
        if (newTheme === 'matrix' && !matrixUnlocked) return;
        setTheme(newTheme);
    };

    if (!user) return <Navigate to="/login" />;
    if (user.role === 'teacher') return <Navigate to="/teacher" />;

    return (
        <div className="container">
            <div className="bg-effects">
                <div className="glow-blob glow-blob-1"></div>
                <div className="glow-blob glow-blob-2"></div>
            </div>

            {theme === 'matrix' && <MatrixRain active={true} />}
            
            <Navigation
                user={user}
                logout={logout}
                onThemeChange={handleEquipTheme}
                currentTheme={theme}
                matrixUnlocked={matrixUnlocked}
            />
            
            <main className="content">
                <Routes>
                    <Route path="/" element={<Navigate to="/quiz" />} />
                    <Route 
                        path="/quiz" 
                        element={<Quiz user={user} onUpdateUser={updateUser} />} 
                    />
                    <Route 
                        path="/shop" 
                        element={
                            <Shop 
                                user={user} 
                                onUpdateUser={updateUser} 
                                onEquipTheme={handleEquipTheme} 
                                onMatrixUnlock={() => setMatrixUnlocked(true)}
                            />
                        } 
                    />
                    <Route 
                        path="/stats" 
                        element={<Stats user={user} />} 
                    />
                </Routes>
            </main>
        </div>
    );
};

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return <div className="loading">Cargando...</div>;
    
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;
    
    return children;
};

const LoginWrapper = () => {
    const { user } = useContext(AuthContext);
    if (user) {
        return <Navigate to={user.role === 'teacher' ? "/teacher" : "/"} />;
    }
    return <Login />; 
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-shell">
                    <div className="app-routes">
                        <Routes>
                            <Route path="/login" element={<LoginWrapper />} />
                            <Route 
                                path="/teacher" 
                                element={
                                    <ProtectedRoute role="teacher">
                                        <TeacherDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/*" 
                                element={
                                    <ProtectedRoute>
                                        <MainLayout />
                                    </ProtectedRoute>
                                } 
                            />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
