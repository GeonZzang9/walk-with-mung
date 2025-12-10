import { useState } from 'react';
import './ReservationModal.css';

interface VerificationModalProps {
    title: string;
    description?: string;
    onConfirm: (name: string, phone: string) => Promise<void> | void;
    onClose: () => void;
}

export const VerificationModal = ({
    title,
    description,
    onConfirm,
    onClose,
}: VerificationModalProps) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async () => {
        if (!name || !phone) {
            alert('성함과 전화번호를 모두 입력해주세요.');
            return;
        }

        await onConfirm(name, phone);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>
                    ×
                </button>
                <h2>{title}</h2>
                {description && <p style={{ marginBottom: '12px' }}>{description}</p>}
                <div className="modal-content">
                    <div className="form-group">
                        <label>예약자 성함</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예약 시 입력한 성함"
                        />
                    </div>
                    <div className="form-group">
                        <label>전화번호</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="예약 시 입력한 전화번호"
                        />
                    </div>
                    <button
                        className="confirm-button"
                        onClick={handleSubmit}
                        disabled={!name || !phone}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};
