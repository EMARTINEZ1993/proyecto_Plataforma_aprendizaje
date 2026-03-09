import React, { useEffect, useMemo, useState } from 'react';
import { questions } from '../data/questions';
import { soundManager } from '../utils/SoundManager';
import { api } from '../utils/api';

const buildShuffledOrder = (length) => {
    const order = Array.from({ length }, (_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
};

const isValidSavedOrder = (order, length) => {
    if (!Array.isArray(order) || order.length !== length) return false;
    const unique = new Set(order);
    if (unique.size !== length) return false;
    return order.every((value) => Number.isInteger(value) && value >= 0 && value < length);
};

export default function Quiz({ user, onUpdateUser }) {
    const [questionOrder, setQuestionOrder] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizInitialized, setQuizInitialized] = useState(false);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(user.streak || 0);
    const [maxStreak, setMaxStreak] = useState(user.max_streak || 0);
    const [energy, setEnergy] = useState(user.energy || 100);
    const [answered, setAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [levelUpLevel, setLevelUpLevel] = useState(null);
    const [quizCompletedNotice, setQuizCompletedNotice] = useState(false);
    const [shuffledOptions, setShuffledOptions] = useState([]);
    const [correctIndex, setCorrectIndex] = useState(0);

    const orderStorageKey = useMemo(() => (user?.id ? `mlQuizQuestionOrder_user_${user.id}` : null), [user?.id]);
    const indexStorageKey = useMemo(() => (user?.id ? `mlQuizCurrentIndex_user_${user.id}` : null), [user?.id]);

    const totalQuestions = questions.length;
    const currentQuestion = questionOrder.length > 0 ? questions[questionOrder[currentQuestionIndex]] : null;

    useEffect(() => {
        if (!orderStorageKey || !indexStorageKey || totalQuestions === 0) return;

        let isCancelled = false;

        const initializeQuizState = async () => {
            const savedOrderRaw = localStorage.getItem(orderStorageKey);
            const savedIndexRaw = localStorage.getItem(indexStorageKey);

            let localOrder = null;
            if (savedOrderRaw) {
                try {
                    const parsed = JSON.parse(savedOrderRaw);
                    if (isValidSavedOrder(parsed, totalQuestions)) localOrder = parsed;
                } catch (error) {
                    console.error('Error reading saved question order:', error);
                }
            }

            let localIndex = Number.parseInt(savedIndexRaw || '0', 10);
            if (!Number.isInteger(localIndex) || localIndex < 0 || localIndex >= totalQuestions) {
                localIndex = 0;
            }

            let backendOrder = null;
            let backendIndex = 0;
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const stateRes = await api.get('/api/quiz-state', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (isValidSavedOrder(stateRes.data?.order, totalQuestions)) {
                        backendOrder = stateRes.data.order;
                    }

                    const parsedBackendIndex = Number.parseInt(stateRes.data?.index ?? 0, 10);
                    if (Number.isInteger(parsedBackendIndex) && parsedBackendIndex >= 0 && parsedBackendIndex < totalQuestions) {
                        backendIndex = parsedBackendIndex;
                    }
                } catch (error) {
                    console.error('Error fetching quiz state from backend:', error);
                }
            }

            let nextOrder = backendOrder || localOrder;
            let nextIndex = backendOrder ? backendIndex : localIndex;

            if (!nextOrder) {
                nextOrder = buildShuffledOrder(totalQuestions);
                nextIndex = 0;
            }

            localStorage.setItem(orderStorageKey, JSON.stringify(nextOrder));
            localStorage.setItem(indexStorageKey, String(nextIndex));

            if (token && (!backendOrder || backendIndex !== nextIndex || JSON.stringify(backendOrder) !== JSON.stringify(nextOrder))) {
                try {
                    await api.post('/api/quiz-state', { order: nextOrder, index: nextIndex }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (error) {
                    console.error('Error syncing initial quiz state:', error);
                }
            }

            if (isCancelled) return;

            setQuestionOrder(nextOrder);
            setCurrentQuestionIndex(nextIndex);
            setAnswered(false);
            setSelectedOption(null);
            setFeedback(null);
            setQuizInitialized(true);
        };

        initializeQuizState();

        return () => {
            isCancelled = true;
        };
    }, [orderStorageKey, indexStorageKey, totalQuestions]);

    useEffect(() => {
        if (!indexStorageKey || questionOrder.length === 0 || !quizInitialized) return;

        localStorage.setItem(indexStorageKey, String(currentQuestionIndex));

        const token = localStorage.getItem('token');
        if (!token) return;

        api.post('/api/quiz-state', { order: questionOrder, index: currentQuestionIndex }, {
            headers: { Authorization: `Bearer ${token}` }
        }).catch((error) => {
            console.error('Error saving quiz state to backend:', error);
        });
    }, [currentQuestionIndex, indexStorageKey, questionOrder, questionOrder.length, quizInitialized]);

    useEffect(() => {
        if (!currentQuestion) return;

        const options = [...currentQuestion.options];
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        setShuffledOptions(options);
        setCorrectIndex(options.indexOf(currentQuestion.options[currentQuestion.correct]));
        setAnswered(false);
        setSelectedOption(null);
        setFeedback(null);
    }, [currentQuestion]);

    useEffect(() => {
        if (!feedback) return;
        const timeoutId = setTimeout(() => setFeedback(null), 1500);
        return () => clearTimeout(timeoutId);
    }, [feedback]);

    useEffect(() => {
        if (!levelUpLevel) return;
        const timeoutId = setTimeout(() => setLevelUpLevel(null), 2600);
        return () => clearTimeout(timeoutId);
    }, [levelUpLevel]);

    useEffect(() => {
        if (!quizCompletedNotice) return;
        const timeoutId = setTimeout(() => setQuizCompletedNotice(false), 2600);
        return () => clearTimeout(timeoutId);
    }, [quizCompletedNotice]);

    const handleAnswer = async (index) => {
        if (answered || !currentQuestion) return;

        const isCorrect = index === correctIndex;
        setSelectedOption(index);
        setAnswered(true);

        let pointsGained = 0;
        let newEnergy = energy;
        let newStreak = 0;
        let newMaxStreak = user.max_streak || 0;
        let newTotalCorrect = user.total_correct || 0;

        if (isCorrect) {
            pointsGained = currentQuestion.points;
            setScore((prev) => prev + 1);

            newStreak = streak + 1;
            setStreak(newStreak);

            if (newStreak > maxStreak) setMaxStreak(newStreak);
            if (newStreak > newMaxStreak) newMaxStreak = newStreak;

            newEnergy = Math.min(100, energy + 25);
            newTotalCorrect += 1;

            setFeedback({ type: 'correct', msg: `Correcto! +${pointsGained} pts` });
            soundManager.play('correct');
        } else {
            newEnergy = Math.max(0, energy - 20);
            newStreak = 0;
            setStreak(0);
            setFeedback({ type: 'incorrect', msg: `Incorrecto. Respuesta: ${shuffledOptions[correctIndex]}` });
            soundManager.play('incorrect');
        }

        setEnergy(newEnergy);

        const currentPoints = Number.parseInt(user.points || 0, 10);
        const newTotalPoints = currentPoints + pointsGained;
        const newLevel = Math.floor(newTotalCorrect / 10) + 1;
        const newTotalAnswered = (user.total_answered || 0) + 1;

        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/api/progress', {
                points: newTotalPoints,
                level: newLevel,
                energy: newEnergy,
                streak: newStreak,
                maxStreak: newMaxStreak,
                totalAnswered: newTotalAnswered,
                totalCorrect: newTotalCorrect
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await api.post('/api/quiz-history', {
                score: isCorrect ? 1 : 0,
                incorrect: isCorrect ? 0 : 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.user) {
                onUpdateUser(res.data.user);
                if (newLevel > (user.level || 1)) {
                    soundManager.play('levelUp');
                    setLevelUpLevel(newLevel);
                }
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const nextQuestion = () => {
        if (questionOrder.length === 0) return;

        if (currentQuestionIndex < questionOrder.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            return;
        }

        setQuizCompletedNotice(true);

        const nextOrder = buildShuffledOrder(questionOrder.length);
        setQuestionOrder(nextOrder);
        setCurrentQuestionIndex(0);
    };

    if (!questions.length) return <div>Cargando preguntas...</div>;
    if (!currentQuestion) return <div className="loading">Cargando quiz...</div>;

    return (
        <div className="main-grid">
            <div className="quiz-card">
                {levelUpLevel && (
                    <div className="levelup-popup" role="status" aria-live="polite">
                        <div className="levelup-title">Subiste de nivel</div>
                        <div className="levelup-value">Nivel {levelUpLevel}</div>
                    </div>
                )}
                {quizCompletedNotice && (
                    <div className="levelup-popup levelup-popup-complete" role="status" aria-live="polite">
                        <div className="levelup-title">Ronda completada</div>
                        <div className="levelup-value">Volviendo al inicio</div>
                    </div>
                )}

                <div className="progress-section">
                    <div className="progress-info">
                        <span>Pregunta {currentQuestionIndex + 1} / {questionOrder.length}</span>
                        <span>{Math.round((currentQuestionIndex / questionOrder.length) * 100)}% Completado</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentQuestionIndex + 1) / questionOrder.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="category-badge">{currentQuestion.category}</div>

                <div className={`difficulty-indicator ${currentQuestion.difficulty}`}>
                    {currentQuestion.difficulty.toUpperCase()}
                </div>

                <h2 className="question">{currentQuestion.question}</h2>

                <div className="options">
                    {shuffledOptions.map((opt, idx) => {
                        let optionClass = 'option';
                        if (answered) {
                            if (idx === correctIndex) optionClass += ' correct';
                            else if (idx === selectedOption) optionClass += ' incorrect';
                            else optionClass += ' disabled';
                        }

                        return (
                            <div
                                key={idx}
                                className={optionClass}
                                onClick={() => !answered && handleAnswer(idx)}
                            >
                                <div className="option-letter">{String.fromCharCode(65 + idx)}</div>
                                <div className="option-text">{opt}</div>
                            </div>
                        );
                    })}
                </div>

                {feedback && (
                    <div className={`feedback quiz-toast ${feedback.type}`}>
                        {feedback.msg}
                    </div>
                )}

                {answered && (
                    <button className="next-btn" onClick={nextQuestion}>
                        Siguiente Pregunta
                    </button>
                )}
            </div>
        </div>
    );
}
