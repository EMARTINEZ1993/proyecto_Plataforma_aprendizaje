import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './Login';
import { api } from '../utils/api';

const TeacherDashboard = () => {
    const [students, setStudents] = useState([]);
    const [resettingId, setResettingId] = useState(null);
    const { token, user, logout } = useContext(AuthContext);

    useEffect(() => {
        if (user?.role === 'teacher') {
            fetchStudents();
        }
    }, [user]);

    const fetchStudents = async () => {
        try {
            const storedToken = localStorage.getItem('token');
            const res = await api.get('/api/teacher/students', {
                headers: { Authorization: `Bearer ${storedToken || token}` }
            });
            setStudents(res.data);
        } catch (err) {
            console.error('Error fetching students', err);
        }
    };

    const formatDate = (value, fallback = 'N/A') => {
        if (!value) return fallback;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return fallback;
        return date.toLocaleString('es-CO');
    };

    const handleResetPassword = async (student) => {
        const confirmReset = window.confirm(`Restablecer la clave de ${student.username}?`);
        if (!confirmReset) return;

        try {
            setResettingId(student.id);
            const storedToken = localStorage.getItem('token');
            const res = await api.post(
                `/api/teacher/students/${student.id}/reset-password`,
                {},
                { headers: { Authorization: `Bearer ${storedToken || token}` } }
            );

            window.alert(`Clave temporal para ${student.username}: ${res.data.tempPassword}`);
        } catch (err) {
            console.error('Error resetting password', err);
            window.alert(err.response?.data?.message || 'No se pudo restablecer la clave');
        } finally {
            setResettingId(null);
        }
    };

    if (user?.role !== 'teacher') {
        return <div className="container">Acceso denegado. Solo para profesores.</div>;
    }

    return (
        <div className="container" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: 'var(--accent-cyan)' }}>Panel del Profesor</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: 'white' }}>Profesor: {user.username}</span>
                    <button className="btn btn-secondary" onClick={logout}>Cerrar Sesion</button>
                </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'right' }} colSpan="14">
                                <button
                                    onClick={() => {
                                        const headers = [
                                            'ID',
                                            'Nombre',
                                            'Documento',
                                            'Correo',
                                            'Ficha',
                                            'Nivel',
                                            'Puntos',
                                            'Respuestas Totales',
                                            'Racha Actual',
                                            'Racha Max',
                                            'Sesiones',
                                            'Ultimo Acceso',
                                            'Fecha Registro'
                                        ];

                                        const csvContent = [
                                            headers.join(','),
                                            ...students.map((s) =>
                                                [
                                                    s.id,
                                                    `"${s.username || ''}"`,
                                                    s.userid || '',
                                                    s.useremail || '',
                                                    s.userficha || '',
                                                    s.level,
                                                    s.points,
                                                    s.total_answered || 0,
                                                    s.streak,
                                                    s.max_streak || 0,
                                                    s.sessions_count || 0,
                                                    formatDate(s.last_login, 'Nunca'),
                                                    formatDate(s.created_at)
                                                ].join(',')
                                            )
                                        ].join('\n');

                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', 'estudiantes.csv');
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="btn btn-primary"
                                    style={{ fontSize: '14px', padding: '6px 12px' }}
                                >
                                    Exportar CSV
                                </button>
                            </th>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                            <th style={{ padding: '15px' }}>ID</th>
                            <th style={{ padding: '15px' }}>Nombre</th>
                            <th style={{ padding: '15px' }}>Documento</th>
                            <th style={{ padding: '15px' }}>Correo</th>
                            <th style={{ padding: '15px' }}>Ficha</th>
                            <th style={{ padding: '15px' }}>Nivel</th>
                            <th style={{ padding: '15px' }}>Puntos</th>
                            <th style={{ padding: '15px' }}>Respuestas Totales</th>
                            <th style={{ padding: '15px' }}>Racha Actual</th>
                            <th style={{ padding: '15px' }}>Racha Max</th>
                            <th style={{ padding: '15px' }}>Sesiones</th>
                            <th style={{ padding: '15px' }}>Ultimo Acceso</th>
                            <th style={{ padding: '15px' }}>Fecha Registro</th>
                            <th style={{ padding: '15px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '15px' }}>{student.id}</td>
                                <td style={{ padding: '15px', fontWeight: 'bold', color: 'white' }}>{student.username || '-'}</td>
                                <td style={{ padding: '15px' }}>{student.userid || '-'}</td>
                                <td style={{ padding: '15px' }}>{student.useremail || '-'}</td>
                                <td style={{ padding: '15px' }}>{student.userficha || '-'}</td>
                                <td style={{ padding: '15px' }}><span className="level-badge">{student.level}</span></td>
                                <td style={{ padding: '15px', color: 'var(--accent-yellow)' }}>{student.points}</td>
                                <td style={{ padding: '15px' }}>{student.total_answered || 0}</td>
                                <td style={{ padding: '15px' }}>{student.streak}</td>
                                <td style={{ padding: '15px' }}>{student.max_streak || 0}</td>
                                <td style={{ padding: '15px' }}>{student.sessions_count || 0}</td>
                                <td style={{ padding: '15px' }}>{formatDate(student.last_login, 'Nunca')}</td>
                                <td style={{ padding: '15px' }}>{formatDate(student.created_at)}</td>
                                <td style={{ padding: '15px' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '12px', padding: '6px 10px' }}
                                        disabled={resettingId === student.id}
                                        onClick={() => handleResetPassword(student)}
                                    >
                                        {resettingId === student.id ? 'Restableciendo...' : 'Restablecer clave'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan="14" style={{ textAlign: 'center', padding: '30px' }}>
                                    No hay estudiantes registrados aun.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherDashboard;
