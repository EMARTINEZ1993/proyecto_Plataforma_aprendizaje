import React, { useState, useEffect } from 'react';
import { shopItems } from '../data/shopItems';
import { soundManager } from '../utils/SoundManager';
import { api } from '../utils/api';

export default function Shop({ user, onUpdateUser, onEquipTheme, onMatrixUnlock }) {
    const [ownedItems, setOwnedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null); 

    useEffect(() => {
        fetchOwnedItems();
    }, []);

    const fetchOwnedItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/api/shop/items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const ownedMap = {};
            res.data.forEach(id => ownedMap[String(id)] = true);
            setOwnedItems(ownedMap);
            if (ownedMap.theme_matrix) {
                onMatrixUnlock?.();
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching items:", error);
            setLoading(false);
        }
    };

    const handleBuy = async (item) => {
        if (user.points < item.price) {
            soundManager.play('incorrect');
            setMsg({ type: 'error', text: 'No tienes suficientes puntos.' });
            setTimeout(() => setMsg(null), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/api/shop/buy', {
                itemId: String(item.id),
                cost: item.price
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            soundManager.play('buy');
            setMsg({ type: 'success', text: `Has comprado ${item.name}.` });
            
            setOwnedItems(prev => ({ ...prev, [String(item.id)]: true }));
            if (item.id === 'theme_matrix') {
                onMatrixUnlock?.();
            }
            
            onUpdateUser({ ...user, points: res.data?.newPoints ?? (user.points - item.price) });
            
            setTimeout(() => setMsg(null), 3000);
        } catch (error) {
            console.error("Purchase error:", error);
            setMsg({ type: 'error', text: error?.response?.data?.message || 'Error al procesar la compra.' });
        }
    };

    const handleViewCode = (item) => {
        setSelectedItem(item);
        soundManager.play('click');
    };

    const closeModal = () => {
        setSelectedItem(null);
        soundManager.play('click');
    };

    const copyCode = () => {
        if (selectedItem) {
            navigator.clipboard.writeText(selectedItem.code);
            soundManager.play('correct');
            alert('Codigo copiado.');
        }
    };

    if (loading) return <div className="loading">Cargando tienda...</div>;

    return (
        <div className="shop-container">
            <div className="shop-header">
                <h1>Tienda de Codigo</h1>
                <div className="user-points">
                    Puntos: {user.points}
                </div>
            </div>

            {msg && <div className={`feedback ${msg.type === 'success' ? 'correct' : 'incorrect'}`} style={{marginBottom: '20px', justifyContent: 'center'}}>
                {msg.text}
            </div>}

            <div className="shop-grid">
                {shopItems.map(item => {
                    const isOwned = ownedItems[String(item.id)];
                    const canAfford = user.points >= item.price;
                    const isTheme = item.id === 'theme_matrix';

                    return (
                        <div key={item.id} className="shop-item-card">
                            <div className="item-icon">{item.icon}</div>
                            <h3 className="item-title">{item.name}</h3>
                            <p className="item-desc">{item.description}</p>
                            
                            {isOwned ? (
                                isTheme ? (
                                    <button className="buy-btn owned" onClick={() => onEquipTheme('matrix')}>
                                        Activar tema
                                    </button>
                                ) : (
                                    <button className="buy-btn owned" onClick={() => handleViewCode(item)}>
                                        Ver codigo
                                    </button>
                                )
                            ) : (
                                <button 
                                    className={`buy-btn ${canAfford ? 'available' : 'disabled'}`}
                                    onClick={() => canAfford && handleBuy(item)}
                                    disabled={!canAfford}
                                >
                                    {item.price} puntos
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedItem && (
                <div className="modal-overlay" onClick={closeModal} style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '90px 16px 24px' }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid #38bdf8', maxWidth: '800px', width: '95%', maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden', margin: '0 auto' }}>
                        <div className="modal-header" style={{ padding: '15px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: '#38bdf8', fontSize: '1.2rem', margin: 0 }}>{selectedItem.name}</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>x</button>
                        </div>
                        <div style={{ padding: '20px', background: '#1e293b', overflowY: 'auto', flex: '1 1 auto' }}>
                            <p style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '0.9rem' }}>{selectedItem.description}</p>
                            <div style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
                                <pre style={{ margin: 0, padding: '20px', overflowX: 'auto', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                    <code>{selectedItem.code}</code>
                                </pre>
                            </div>
                        </div>
                        <div style={{ padding: '15px 20px', background: '#0f172a', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn" onClick={copyCode} style={{ background: '#0ea5e9', color: 'white', padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Copiar</button>
                            <button className="btn" onClick={closeModal} style={{ background: 'transparent', color: '#94a3b8', padding: '8px 20px', borderRadius: '6px', border: '1px solid #475569', cursor: 'pointer', fontWeight: '600' }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
