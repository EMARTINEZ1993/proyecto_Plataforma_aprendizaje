import React, { useState, useEffect } from 'react';
import { questions } from '../data/questions';
import { soundManager } from '../utils/SoundManager';
import { api } from '../utils/api';

export default function Quiz({ user, onUpdateUser }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0); 
    const [streak, setStreak] = useState(user.streak || 0);
    const [maxStreak, setMaxStreak] = useState(user.max_streak || 0);
    const [energy, setEnergy] = useState(user.energy || 100);
    const [answered, setAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [shuffledOptions, setShuffledOptions] = useState([]);
    const [correctIndex, setCorrectIndex] = useState(0);

    useEffect(() => {
        if (currentQuestionIndex < questions.length) {
            const q = questions[currentQuestionIndex];
            const options = [...q.options];
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            setShuffledOptions(options);
            setCorrectIndex(options.indexOf(q.options[q.correct]));
            setAnswered(false);
            setSelectedOption(null);
            setFeedback(null);
        }
    }, [currentQuestionIndex]);

    const handleAnswer = async (index) => {
        if (answered) return;

        const isCorrect = index === correctIndex;
        setSelectedOption(index);
        setAnswered(true);
        
        const currentQ = questions[currentQuestionIndex];
        let pointsGained = 0;
        let newEnergy = energy;
        let newStreak = 0;
        let newMaxStreak = user.max_streak || 0; 
        let newTotalCorrect = user.total_correct || 0;

        if (isCorrect) {
            pointsGained = currentQ.points;
            setScore(prev => prev + 1);
            
            newStreak = streak + 1;
            setStreak(newStreak);
            
            if (newStreak > maxStreak) setMaxStreak(newStreak); 
            if (newStreak > newMaxStreak) newMaxStreak = newStreak; 

            newEnergy = Math.min(100, energy + 25);
            newTotalCorrect += 1;

            setFeedback({ type: 'correct', msg: `¡Correcto! +${pointsGained} pts` });
            soundManager.play('correct');
        } else {
            newEnergy = Math.max(0, energy - 20);
            newStreak = 0;
            setStreak(0);
            setFeedback({ type: 'incorrect', msg: `Incorrecto. La respuesta era: ${shuffledOptions[correctIndex]}` });
            soundManager.play('incorrect');
        }

        setEnergy(newEnergy);

        const currentPoints = parseInt(user.points || 0, 10);
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
                    alert(`¡NIVEL ${newLevel}! 🎉`);
                }
            }
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            alert("¡Has completado todas las preguntas disponibles por ahora! Volviendo al inicio...");
            setCurrentQuestionIndex(0);
        }
    };

    if (!questions.length) return <div>Cargando preguntas...</div>;

    const currentQ = questions[currentQuestionIndex];

    return (
        <div className="main-grid">
            <div className="quiz-card">
                <div className="progress-section">
                    <div className="progress-info">
                        <span>Pregunta {currentQuestionIndex + 1} / {questions.length}</span>
                        <span>{Math.round(((currentQuestionIndex) / questions.length) * 100)}% Completado</span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="category-badge">
                    {currentQ.category}
                </div>
                
                <div className={`difficulty-indicator ${currentQ.difficulty}`}>
                    ★ {currentQ.difficulty.toUpperCase()}
                </div>

                <h2 className="question">{currentQ.question}</h2>
                
                <div className="options">
                    {shuffledOptions.map((opt, idx) => {
                        let optionClass = "option";
                        if (answered) {
                            if (idx === correctIndex) optionClass += " correct";
                            else if (idx === selectedOption) optionClass += " incorrect";
                            else optionClass += " disabled";
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
                    <div className={`feedback ${feedback.type}`}>
                        {feedback.type === 'correct' ? '✅' : '❌'} {feedback.msg}
                    </div>
                )}

                {answered && (
                    <button className="next-btn" onClick={nextQuestion}>
                        Siguiente Pregunta ➡️
                    </button>
                )}
            </div>
        </div>
    );
}
