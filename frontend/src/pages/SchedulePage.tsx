import { useEffect, useState } from 'react';
import './HomePage.css';
import { VerificationModal } from '../components/VerificationModal';

interface ScheduleItem {
    id: number;
    dogId: number;
    date: string;
    time: string;
    status: string;
    reserverName: string;
    reserverPhone: string;
    createdAt: string;
    dogName: string;
    dogBreed: string;
    dogImage: string;
}

export const SchedulePage = () => {
    const [items, setItems] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [targetItem, setTargetItem] = useState<ScheduleItem | null>(null);

    const fetchSchedule = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/reservations');
            if (!response.ok) {
                setError('예약 정보를 불러오지 못했습니다.');
                return;
            }
            const data: ScheduleItem[] = await response.json();
            // 취소/완료된 예약은 숨기고 예약·산책 중인 건만 노출
            setItems(
                data.filter(
                    (item) => item.status === 'reserved' || item.status === 'walking'
                )
            );
        } catch (e) {
            setError('예약 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, []);

    const handleOpenCancelVerify = (item: ScheduleItem) => {
        setTargetItem(item);
    };

    const handleCancelConfirm = async (name: string, phone: string) => {
        if (!targetItem) return;

        try {
            const response = await fetch(
                `http://localhost:4000/api/reservations/${targetItem.id}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reserverName: name,
                        reserverPhone: phone,
                    }),
                }
            );

            if (!response.ok) {
                alert('예약 정보가 일치하지 않아 처리할 수 없습니다.');
                return;
            }

            alert('예약이 취소되었습니다.');
            setTargetItem(null);
            fetchSchedule();
        } catch (e) {
            alert('예약 취소 중 오류가 발생했습니다.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>예약 확인</h1>
            {loading && <p>불러오는 중...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && items.length === 0 && (
                <p>현재 예약 내역이 없습니다.</p>
            )}
            {!loading && !error && items.length > 0 && (
                <div className="products-section">
                    <div className="dog-grid">
                        {items.map((item) => (
                            <div key={item.id} className="dog-card">
                                <div className="status-badge">
                                    {item.date} {item.time}
                                </div>
                                <div className="dog-info">
                                    <h3>예약자: {item.reserverName}</h3>
                                    {/* 전화번호는 예약 확인 페이지에서 표기하지 않음 */}
                                    <p className="breed">연락처: 비공개</p>
                                    <p className="description">
                                        예약 강아지: {item.dogName} ({item.dogBreed})
                                    </p>
                                    <p className="description">
                                        예약 시간: {item.time}
                                    </p>
                                    {item.status === 'reserved' && (
                                        <button
                                            className="reserve-button"
                                            onClick={() => handleOpenCancelVerify(item)}
                                        >
                                            예약 취소
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {targetItem && (
                <VerificationModal
                    title="예약 취소를 위한 예약자 확인"
                    description={`${targetItem.dogName} 예약 건의 예약자 정보를 입력해 주세요.`}
                    onConfirm={handleCancelConfirm}
                    onClose={() => setTargetItem(null)}
                />
            )}
        </div>
    );
};
