import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation({ user, logout, onThemeChange, currentTheme, matrixUnlocked = false }) {
    const location = useLocation();
    const [showSettings, setShowSettings] = useState(false);
    const [muted, setMuted] = useState(localStorage.getItem('mlQuizMuted') === 'true');

    const toggleMute = () => {
        const newState = !muted;
        setMuted(newState);
        localStorage.setItem('mlQuizMuted', newState);
        window.location.reload();
    };

    return (
        <header>
            <div className="header-content">
                <div>
                    <span style={{ fontSize: '1.2em' }}>🤖</span> {user.username}
                </div>

                <div className="header-stats">
                    <div className="stat-item">🔥 {user.streak || 0}</div>
                    <div className="stat-item">
                        <div className="energy-bar">
                            <div className="energy-fill" style={{ width: `${user.energy || 100}%` }}></div>
                        </div>
                    </div>
                    <div className="stat-item">💎 {user.points || 0}</div>
                    <div className="level-badge">LVL {user.level || 1}</div>
                </div>

                <div className="buttons">
                    <Link to="/quiz" className={`btn ${location.pathname === '/quiz' ? 'btn-primary' : 'btn-secondary'}`}>
                        🎮 Quiz
                    </Link>
                    <Link to="/shop" className={`btn ${location.pathname === '/shop' ? 'btn-primary' : 'btn-secondary'}`}>
                        🛒 Tienda
                    </Link>
                    <Link to="/stats" className={`btn ${location.pathname === '/stats' ? 'btn-primary' : 'btn-secondary'}`}>
                        📊 Estadísticas
                    </Link>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="btn btn-secondary"
                        title="Configuración"
                        style={{ fontSize: '1.2rem', padding: '5px 10px' }}
                    >
                        ⚙️
                    </button>
                    <button onClick={logout} className="btn btn-danger">
                        🚪 Salir
                    </button>
                </div>
            </div>

            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>⚙️ Configuración</h3>
                            <button className="btn btn-danger btn-small" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ background: 'var(--card-bg)', border: 'none', color: 'var(--text-primary)' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>🔊 Sonido</label>
                                <button className={`btn ${!muted ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleMute}>
                                    {muted ? 'Desactivado 🔇' : 'Activado 🔊'}
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>🎨 Tema</label>
                                <select
                                    value={currentTheme}
                                    onChange={(e) => onThemeChange(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        background: '#1e293b',
                                        color: 'white',
                                        border: '1px solid #475569'
                                    }}
                                >
                                    <option value="default">Dark Mode (Default)</option>
                                    <option value="light">Light Mode</option>
                                    <option value="cyberpunk">Cyberpunk</option>
                                    <option value="matrix" disabled={!matrixUnlocked}>
                                        {matrixUnlocked ? 'Matrix Mode' : 'Matrix Mode (Bloqueado 🔒)'}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
