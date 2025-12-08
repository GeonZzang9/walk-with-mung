import { useState } from 'react';
import type { Dog } from '../types';
import './ReservationModal.css';

interface ReservationModalProps {
    dog: Dog;
    onClose: () => void;
    onReserved?: () => void;
}

export const ReservationModal = ({ dog, onClose, onReserved }: ReservationModalProps) => {
    const [reservationTime, setReservationTime] = useState('');
    const [reserverName, setReserverName] = useState('');
    const [reserverPhone, setReserverPhone] = useState('');

    const handleReservationApi = async () => {
        if (!reservationTime || !reserverName || !reserverPhone) {
            alert('이름, 전화번호, 시간을 모두 입력해주세요.');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        try {
            const response = await fetch('http://localhost:4000/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dogId: dog.id,
                    time: reservationTime,
                    reserverName,
                    reserverPhone,
                }),
            });

            if (!response.ok) {
                console.error('Failed to create reservation', response.statusText);
                alert('예약 생성에 실패했어요. 다시 시도해주세요.');
                return;
            }

            alert(
                `${dog.name} 산책이 예약되었어요.\n` +
                `예약자: ${reserverName}\n` +
                `연락처: ${reserverPhone}\n` +
                `날짜: ${today}\n` +
                `시간: ${reservationTime}`
            );
            if (onReserved) {
                onReserved();
            }
            onClose();
        } catch (error) {
            console.error('Error creating reservation', error);
            alert('예약 중 오류가 발생했어요. 다시 시도해주세요.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <h2>{dog.name}와(과) 산책 예약</h2>
                <div className="modal-content">
                    <div className="dog-preview">
                        <span className="dog-image-large">{dog.image}</span>
                        <div>
                            <h3>{dog.name}</h3>
                            <p>{dog.breed} · {dog.age}살</p>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>예약자 성함</label>
                        <input
                            type="text"
                            value={reserverName}
                            onChange={(e) => setReserverName(e.target.value)}
                            placeholder="이름을 입력해주세요"
                        />
                    </div>

                    <div className="form-group">
                        <label>전화번호</label>
                        <input
                            type="tel"
                            value={reserverPhone}
                            onChange={(e) => setReserverPhone(e.target.value)}
                            placeholder="010-0000-0000"
                        />
                    </div>

                    <div className="form-group">
                        <label>예약 시간</label>
                        <select
                            value={reservationTime}
                            onChange={(e) => setReservationTime(e.target.value)}
                        >
                            <option value="">시간을 선택해주세요</option>
                            <option value="09:00">09:00</option>
                            <option value="10:00">10:00</option>
                            <option value="11:00">11:00</option>
                            <option value="14:00">14:00</option>
                            <option value="15:00">15:00</option>
                            <option value="16:00">16:00</option>
                            <option value="17:00">17:00</option>
                        </select>
                    </div>

                    <button
                        className="confirm-button"
                        onClick={handleReservationApi}
                        disabled={
                            !reservationTime ||
                            !reserverName ||
                            !reserverPhone
                        }
                    >
                        예약 확정
                    </button>
                </div>
            </div>
        </div>
    );
};

