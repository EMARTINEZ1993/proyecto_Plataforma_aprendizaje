import React, { useState, useEffect } from 'react';
import { badges } from '../data/badges';
import { api } from '../utils/api';

export default function Stats({ user }) {
    const [ownedCount, setOwnedCount] = useState(0);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await api.get('/api/shop/items', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOwnedCount(res.data.length);
            } catch (e) {
                console.error(e);
            }
        };
        fetchItems();
    }, []);

    const statsForBadges = {
        score: user.total_correct || 0,
        points: user.points || 0,
        maxStreak: user.max_streak || 0,
        level: user.level || 1,
        ownedBlocks: { length: ownedCount } 
    };
    
    const ownedBlocksMock = {};
    for(let i=0; i<ownedCount; i++) ownedBlocksMock[i] = true;
    statsForBadges.ownedBlocks = ownedBlocksMock;

    const accuracy = user.total_answered > 0 
        ? Math.round((user.total_correct / user.total_answered) * 100) 
        : 0;

    const nextLevelXP = user.level * 10; // Simple logic: 10 correct per level
    const currentXP = (user.total_correct || 0) % 10;
    const levelProgress = (currentXP / 10) * 100;

    return (
        <div className="stats-container">
            <div className="stats-header">
                <h1>Tus Estadísticas</h1>
            </div>
            
            <div className="stats-grid-main">
                <div className="stat-card">
                    <div className="stat-icon">🚀</div>
                    <div className="stat-value">{user.level}</div>
                    <div className="stat-label">Nivel Actual</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💎</div>
                    <div className="stat-value">{user.points}</div>
                    <div className="stat-label">Puntos Totales</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{user.total_correct || 0}</div>
                    <div className="stat-label">Respuestas Correctas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-value">{user.max_streak || 0}</div>
                    <div className="stat-label">Mejor Racha</div>
                </div>
            </div>

            <div className="details-section">
                <div className="detail-card">
                    <h3 className="detail-title">Precisión Global</h3>
                    <div className="big-progress-bar">
                        <div className="big-progress-fill" style={{ width: `${accuracy}%` }}></div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#22c55e' }}>{accuracy}%</div>
                </div>
                <div className="detail-card">
                    <h3 className="detail-title">Información Adicional</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Nivel Actual</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{user.level}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Puntos</span>
                        <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{user.points}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Bloques Desbloqueados</span>
                        <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>{ownedCount}</span>
                    </div>
                </div>
            </div>

            <div className="badges-section">
                <h3 className="section-title">🏅 Medallas y Logros</h3>
                <div className="badges-grid-large">
                    {badges.map(badge => {
                        const isUnlocked = badge.condition(statsForBadges);
                        return (
                            <div key={badge.id} className={`badge-large ${isUnlocked ? 'unlocked' : ''}`}>
                                <div className="badge-icon-large">{isUnlocked ? badge.icon : badge.icon}</div>
                                <div className="badge-name-large">{badge.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>
                                    {isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

