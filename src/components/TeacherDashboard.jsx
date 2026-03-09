import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './Login';
import { api } from '../utils/api';

const PAGE_SIZE = 10;

const SORTABLE_COLUMNS = {
    level: 'Nivel',
    points: 'Puntos',
    total_answered: 'Respuestas',
    streak: 'Racha',
    sessions_count: 'Sesiones',
    last_login: 'Ultimo acceso'
};

const getTimestamp = (value) => {
    if (!value) return 0;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const isActiveInLastDays = (value, days) => {
    const ts = getTimestamp(value);
    if (!ts) return false;
    const now = Date.now();
    const diff = now - ts;
    return diff <= days * 24 * 60 * 60 * 1000;
};

const TeacherDashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resettingId, setResettingId] = useState(null);

    const [search, setSearch] = useState('');
    const [selectedFicha, setSelectedFicha] = useState('all');
    const [activityFilter, setActivityFilter] = useState('all');
    const [sortBy, setSortBy] = useState('points');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);

    const { token, user, logout } = useContext(AuthContext);

    useEffect(() => {
        if (user?.role === 'teacher') {
            fetchStudents();
        }
    }, [user]);

    useEffect(() => {
        setPage(1);
    }, [search, selectedFicha, activityFilter]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const storedToken = localStorage.getItem('token');
            const res = await api.get('/api/teacher/students', {
                headers: { Authorization: `Bearer ${storedToken || token}` }
            });
            setStudents(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching students', err);
        } finally {
            setLoading(false);
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

    const fichas = useMemo(() => {
        const unique = new Set(students.map((s) => (s.userficha || '').trim()).filter(Boolean));
        return ['all', ...Array.from(unique)];
    }, [students]);

    const kpis = useMemo(() => {
        const total = students.length;
        const active7d = students.filter((s) => isActiveInLastDays(s.last_login, 7)).length;
        const totalPoints = students.reduce((acc, s) => acc + Number(s.points || 0), 0);
        const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;

        let topStudent = null;
        for (const s of students) {
            if (!topStudent || Number(s.points || 0) > Number(topStudent.points || 0)) {
                topStudent = s;
            }
        }

        return { total, active7d, avgPoints, topStudentName: topStudent?.username || '-' };
    }, [students]);

    const filteredStudents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return students.filter((s) => {
            if (selectedFicha !== 'all' && (s.userficha || '') !== selectedFicha) return false;
            if (activityFilter === 'active7d' && !isActiveInLastDays(s.last_login, 7)) return false;
            if (activityFilter === 'inactive7d' && isActiveInLastDays(s.last_login, 7)) return false;

            if (!normalizedSearch) return true;

            const searchable = [s.username || '', s.userid || '', s.useremail || ''].join(' ').toLowerCase();
            return searchable.includes(normalizedSearch);
        });
    }, [students, search, selectedFicha, activityFilter]);

    const sortedStudents = useMemo(() => {
        const arr = [...filteredStudents];

        arr.sort((a, b) => {
            let va = a[sortBy];
            let vb = b[sortBy];

            if (sortBy === 'last_login') {
                va = getTimestamp(va);
                vb = getTimestamp(vb);
            }

            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();

            if (va == null) va = '';
            if (vb == null) vb = '';

            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            return 0;
        });

        return arr;
    }, [filteredStudents, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginatedStudents = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sortedStudents.slice(start, start + PAGE_SIZE);
    }, [sortedStudents, page]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortBy(column);
        setSortDir('desc');
    };

    const exportCsv = () => {
        const headers = [
            'ID', 'Nombre', 'Documento', 'Correo', 'Ficha', 'Nivel', 'Puntos', 'Respuestas Totales',
            'Racha Actual', 'Sesiones', 'Ultimo Acceso', 'Fecha Registro'
        ];

        const csvContent = [
            headers.join(','),
            ...sortedStudents.map((s) => [
                s.id,
                `"${s.username || ''}"`,
                s.userid || '',
                s.useremail || '',
                s.userficha || '',
                s.level,
                s.points,
                s.total_answered || 0,
                s.streak,
                s.sessions_count || 0,
                formatDate(s.last_login, 'Nunca'),
                formatDate(s.created_at)
            ].join(','))
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
    };

    if (user?.role !== 'teacher') {
        return <div className="container">Acceso denegado. Solo para profesores.</div>;
    }

    return (
        <div className="container teacher-dashboard">
            <div className="teacher-toolbar">
                <h1 className="teacher-title">Panel del Profesor</h1>
                <div className="teacher-toolbar-actions">
                    <span className="teacher-welcome">Profesor: {user.username}</span>
                    <button className="btn btn-secondary" onClick={fetchStudents}>Actualizar</button>
                    <button className="btn btn-secondary" onClick={logout}>Cerrar Sesion</button>
                </div>
            </div>

            <div className="teacher-kpi-grid">
                <div className="table-container teacher-kpi-card">
                    <div className="teacher-kpi-label">Total estudiantes</div>
                    <div className="teacher-kpi-value">{kpis.total}</div>
                </div>
                <div className="table-container teacher-kpi-card">
                    <div className="teacher-kpi-label">Activos (7 dias)</div>
                    <div className="teacher-kpi-value">{kpis.active7d}</div>
                </div>
                <div className="table-container teacher-kpi-card">
                    <div className="teacher-kpi-label">Promedio puntos</div>
                    <div className="teacher-kpi-value">{kpis.avgPoints}</div>
                </div>
                <div className="table-container teacher-kpi-card">
                    <div className="teacher-kpi-label">Top estudiante</div>
                    <div className="teacher-kpi-value teacher-kpi-value-small">{kpis.topStudentName}</div>
                </div>
            </div>

            <div className="table-container teacher-filters">
                <div className="teacher-filter-grid">
                    <div>
                        <label className="teacher-filter-label">Buscar</label>
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Nombre, documento o correo"
                        />
                    </div>
                    <div>
                        <label className="teacher-filter-label">Ficha</label>
                        <select className="form-input" value={selectedFicha} onChange={(e) => setSelectedFicha(e.target.value)}>
                            {fichas.map((ficha) => (
                                <option key={ficha} value={ficha}>{ficha === 'all' ? 'Todas' : ficha}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="teacher-filter-label">Actividad</label>
                        <select className="form-input" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="active7d">Activos (7 dias)</option>
                            <option value="inactive7d">Inactivos (7 dias)</option>
                        </select>
                    </div>
                    <button onClick={exportCsv} className="btn btn-primary teacher-export-btn">Exportar CSV</button>
                </div>
            </div>

            <div className="table-container teacher-table-wrap">
                <table className="teacher-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Documento</th>
                            {Object.entries(SORTABLE_COLUMNS).map(([key, label]) => (
                                <th key={key} className="teacher-sortable" onClick={() => handleSort(key)} title="Ordenar">
                                    {label} {sortBy === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                            ))}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && paginatedStudents.map((student) => (
                            <tr key={student.id}>
                                <td className="teacher-name">{student.username || '-'}</td>
                                <td>{student.userid || '-'}</td>
                                <td><span className="level-badge">{student.level}</span></td>
                                <td className="teacher-points">{student.points}</td>
                                <td>{student.total_answered || 0}</td>
                                <td>{student.streak}</td>
                                <td>{student.sessions_count || 0}</td>
                                <td>{formatDate(student.last_login, 'Nunca')}</td>
                                <td>
                                    <button
                                        className="btn btn-secondary teacher-reset-btn"
                                        disabled={resettingId === student.id}
                                        onClick={() => handleResetPassword(student)}
                                    >
                                        {resettingId === student.id ? 'Restableciendo...' : 'Restablecer clave'}
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {loading && (
                            <tr>
                                <td colSpan="9" className="teacher-empty">Cargando estudiantes...</td>
                            </tr>
                        )}

                        {!loading && sortedStudents.length === 0 && (
                            <tr>
                                <td colSpan="9" className="teacher-empty">No hay resultados con los filtros actuales.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="teacher-pagination">
                <span className="teacher-pagination-text">
                    Mostrando {(page - 1) * PAGE_SIZE + (paginatedStudents.length ? 1 : 0)}-{(page - 1) * PAGE_SIZE + paginatedStudents.length} de {sortedStudents.length}
                </span>
                <div className="teacher-pagination-controls">
                    <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
                    <span className="teacher-page-indicator">Pagina {page} de {totalPages}</span>
                    <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente</button>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
