import { useState, useContext, useEffect, createContext } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const res = await api.get('/api/user', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        setUser(res.data);
                        localStorage.setItem('user', JSON.stringify(res.data));
                    }
                } catch (err) {
                    console.error('Failed to fetch user:', err);
                    if (err.response && err.response.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const updateUser = (newData) => {
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [identifier, setIdentifier] = useState('');
    const [userid, setUserid] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [useremail, setUseremail] = useState('');
    const { login } = useContext(AuthContext);
    const [userficha, setUserficha] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/login' : '/api/register';

        try {
            const payload = isLogin
                ? { identifier: identifier.trim(), password }
                : {
                    username,
                    password,
                    userid,
                    useremail,
                    userficha
                };

            const res = await api.post(endpoint, payload);
            if (res.data.auth) {
                login(res.data.user, res.data.token);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error occurred');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="auth-card">
                <div className="logo" style={{ justifyContent: 'center', fontSize: '2rem' }}>
                    <span style={{ fontSize: '1.2em' }}>: ..</span>
                </div>

                <div className="auth-tabs">
                    <div className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
                        Login
                    </div>
                    <div className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
                        Register
                    </div>
                </div>

                <h2 style={{ marginBottom: '20px', textAlign: 'center', color: 'var(--text-primary)' }}>
                    {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
                </h2>

                {error && <div className="feedback incorrect" style={{ marginBottom: '20px', justifyContent: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {isLogin ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">Usuario, correo o Numero de documento:</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="Ingrese su usuario, correo o numero de documento"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contrasena:</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div className="register-grid">
                            <div className="form-group full-width">
                                <label className="form-label">Ficha de Aprendizaje:</label>
                                <select value={userficha} onChange={(e) => setUserficha(e.target.value)} required className="form-input">
                                    <option value="">Seleccione su ficha de Aprendizaje</option>
                                    <option value="3062785 - 706">3062785</option>
                                    <option value="3065909 - 806">3065909</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Numero de documento:</label>
                                <input type="number" className="form-input" value={userid} onChange={(e) => setUserid(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nombre Completo:</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Correo electronico:</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={useremail}
                                    onChange={(e) => setUseremail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contrasena:</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}
                    <button type="submit" className="submit-btn">
                        {isLogin ? 'Iniciar Sesion' : 'Registrarse'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
