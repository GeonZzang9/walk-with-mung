import { useEffect, useState } from 'react';
import type { Dog, WalkStatus } from '../types';
import { DogCard } from '../components/DogCard';
import { VerificationModal } from '../components/VerificationModal';
import './HomePage.css';

interface StatusListPageProps {
    status: WalkStatus;
    title: string;
    description: string;
}

type VerifyAction = 'start' | 'complete';

interface VerifyState {
    dog: Dog;
    action: VerifyAction;
}

interface CompletedReservation {
    id: number;
    dogId: number;
    date: string;
    time: string;
    reserverName: string;
    reserverPhone: string;
    dogName: string;
    dogBreed: string;
    walkStartTime?: string | null;
    walkEndTime?: string | null;
    completedBy?: string | null;
}

const StatusListPage = ({ status, title, description }: StatusListPageProps) => {
    const [dogs, setDogs] = useState<Dog[]>([]);
    const [verifyState, setVerifyState] = useState<VerifyState | null>(null);

    const fetchDogs = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/dogs');
            if (!response.ok) {
                console.error('Failed to fetch dogs', response.statusText);
                return;
            }
            const data: Dog[] = await response.json();
            setDogs(data);
        } catch (error) {
            console.error('Error fetching dogs', error);
        }
    };

    useEffect(() => {
        fetchDogs();
    }, []);

    const openVerify = (dog: Dog, action: VerifyAction) => {
        setVerifyState({ dog, action });
    };

    const handleVerifyConfirm = async (name: string, phone: string) => {
        if (!verifyState) return;
        const { dog, action } = verifyState;

        try {
            if (action === 'start') {
                const response = await fetch(`http://localhost:4000/api/dogs/${dog.id}/start-walk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reserverName: name,
                        reserverPhone: phone,
                    }),
                });

                if (!response.ok) {
                    alert('예약 정보가 일치하지 않아 산책을 시작할 수 없습니다.');
                    return;
                }

                alert('산책을 시작했습니다.');
            } else if (action === 'complete') {
                const response = await fetch(`http://localhost:4000/api/dogs/${dog.id}/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        reserverName: name,
                        reserverPhone: phone,
                    }),
                });

                if (!response.ok) {
                    alert('예약 정보가 일치하지 않아 산책 완료 처리에 실패했습니다.');
                    return;
                }

                alert('산책이 완료되었습니다.');
            }

            await fetchDogs();
            setVerifyState(null);
        } catch (error) {
            console.error('Error handling verified action', error);
            alert('처리 중 오류가 발생했습니다.');
        }
    };

    const filteredDogs = dogs.filter((dog) => dog.status === status);

    const currentVerifyTitle =
        verifyState?.action === 'start'
            ? '산책 시작을 위한 예약자 확인'
            : '산책 완료를 위한 예약자 확인';

    return (
        <div className="home-page" style={{ padding: '20px' }}>
            <h1>{title}</h1>
            <p>{description}</p>

            <div className="products-section">
                <div className="dog-grid">
                    {filteredDogs.map((dog) => (
                        <div key={dog.id}>
                            <DogCard
                                dog={dog}
                                onClick={() => {}}
                                onComplete={status === 'walking' ? () => openVerify(dog, 'complete') : undefined}
                                onReset={undefined}
                                onStartWalk={status === 'reserved' ? () => openVerify(dog, 'start') : undefined}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {verifyState && (
                <VerificationModal
                    title={currentVerifyTitle}
                    description={`${verifyState.dog.name} 예약 건의 예약자 정보를 입력해 주세요.`}
                    onConfirm={handleVerifyConfirm}
                    onClose={() => setVerifyState(null)}
                />
            )}
        </div>
    );
};

export const ReservedDogsPage = () => (
    <StatusListPage
        status="reserved"
        title="예약 대기"
        description="예약이 잡혀 있는 강아지들을 볼 수 있어요."
    />
);

export const WalkingDogsPage = () => (
    <StatusListPage
        status="walking"
        title="산책 중"
        description="현재 산책 중인 강아지들을 볼 수 있어요."
    />
);

export const CompletedDogsPage = () => {
    const [items, setItems] = useState<CompletedReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let timeoutId: number | undefined;

        const fetchCompleted = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:4000/api/reservations');
                if (!response.ok) {
                    setError('산책 완료 내역을 불러오지 못했습니다.');
                    return;
                }
                const data = (await response.json()) as any[];
                const today = new Date().toISOString().slice(0, 10);
                const filtered = data.filter(
                    (item) =>
                        item.status === 'completed' &&
                        item.date === today &&
                        item.completedBy === 'manual'
                ) as CompletedReservation[];
                setItems(filtered);
                setError(null);
            } catch {
                setError('산책 완료 내역을 불러오는 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        const scheduleMidnightRefresh = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const msUntilMidnight = tomorrow.getTime() - now.getTime();

            timeoutId = window.setTimeout(async () => {
                await fetchCompleted();
                scheduleMidnightRefresh();
            }, msUntilMidnight);
        };

        fetchCompleted();
        scheduleMidnightRefresh();

        return () => {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    return (
        <div className="home-page" style={{ padding: '20px' }}>
            <h1>산책 완료 이력</h1>
            <p>오늘 산책이 완료된 예약 내역만 확인할 수 있어요.</p>

            {loading && <p>불러오는 중...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && items.length === 0 && (
                <p>오늘 완료된 산책 내역이 없습니다.</p>
            )}

            {!loading && !error && items.length > 0 && (
                <div className="products-section">
                    <div className="dog-grid">
                        {items.map((item) => (
                            <div key={item.id} className="dog-card">
                                <div className="status-badge">산책 완료</div>
                                <div className="dog-info">
                                    <h3>예약자: {item.reserverName}</h3>
                                    <p className="breed">연락처: {item.reserverPhone}</p>
                                    <p className="description">
                                        산책 강아지: {item.dogName} ({item.dogBreed})
                                    </p>
                                    <p className="description">
                                        산책 시간:{' '}
                                        {item.walkStartTime && item.walkEndTime
                                            ? `${item.walkStartTime} ~ ${item.walkEndTime}`
                                            : `시작: ${item.time} (종료 시간 정보 없음)`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

