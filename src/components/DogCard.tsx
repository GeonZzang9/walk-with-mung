import type { Dog, WalkStatus } from '../types';
import './DogCard.css';

interface DogCardProps {
    dog: Dog;
    onClick: (dog: Dog) => void;
    onComplete?: (dog: Dog) => void;
    onReset?: (dog: Dog) => void;
    onStartWalk?: (dog: Dog) => void;
}

const getStatusText = (status: WalkStatus) => {
    switch (status) {
        case 'available': return '예약 가능';
        case 'reserved': return '예약 대기';
        case 'walking': return '산책 중';
        case 'completed': return '산책 완료';
        default: return '';
    }
};

const getStatusColor = (status: WalkStatus) => {
    switch (status) {
        case 'available': return '#4CAF50';
        case 'reserved': return '#2196F3';
        case 'walking': return '#FF9800';
        case 'completed': return '#9E9E9E';
        default: return '#9E9E9E';
    }
};

export const DogCard = ({ dog, onClick, onComplete, onReset, onStartWalk }: DogCardProps) => {
    return (
        <div
            className={`dog-card ${dog.status === 'available' ? 'clickable' : ''}`}
            onClick={() => onClick(dog)}
        >
            <div className="status-badge" style={{ backgroundColor: getStatusColor(dog.status) }}>
                {getStatusText(dog.status)}
            </div>
            <div className="dog-image">{dog.image}</div>
            <div className="dog-info">
                <h3>{dog.name}</h3>
                <p className="breed">
                    {dog.breed} · {dog.age}살
                </p>
                {dog.status !== 'available' && dog.reserverName && (
                    <p className="description">예약자: {dog.reserverName}</p>
                )}
                <p className="description">{dog.description}</p>

                {dog.status === 'walking' && (
                    <>
                        <p className="status-info">산책 예정 종료: {dog.currentWalkEnd}</p>
                        {onComplete && (
                            <button
                                className="reserve-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onComplete(dog);
                                }}
                            >
                                산책 완료
                            </button>
                        )}
                    </>
                )}

                {dog.status === 'completed' && (
                    <>
                        <p className="status-info">오늘 산책 완료: {dog.lastWalkTime}</p>
                        {onReset && (
                            <button
                                className="reserve-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset(dog);
                                }}
                            >
                                다시 산책 가능하게
                            </button>
                        )}
                    </>
                )}

                {dog.status === 'available' && (
                    <button
                        className="reserve-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(dog);
                        }}
                    >
                        예약하기
                    </button>
                )}

                {dog.status === 'reserved' && onStartWalk && (
                    <button
                        className="reserve-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartWalk(dog);
                        }}
                    >
                        산책 시작
                    </button>
                )}
            </div>
        </div>
    );
};

