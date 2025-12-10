import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Dog } from '../types';
import { DogCard } from '../components/DogCard';
import { ReservationModal } from '../components/ReservationModal';
import './HomePage.css';

interface HomePageProps {
    autoScrollToList?: boolean;
}

export const HomePage = ({ autoScrollToList = false }: HomePageProps) => {
    const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [dogs, setDogs] = useState<Dog[]>([]);
    const productsSectionRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        if (autoScrollToList && productsSectionRef.current) {
            productsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [autoScrollToList]);

    const availableDogs = dogs.filter((dog) => dog.status === 'available');

    const handleDogClick = (dog: Dog) => {
        if (dog.status === 'available') {
            setSelectedDog(dog);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedDog(null);
        fetchDogs();
    };

    const handleCompleteWalk = async (dog: Dog) => {
        try {
            const response = await fetch(`http://localhost:4000/api/dogs/${dog.id}/complete`, {
                method: 'POST',
            });

            if (!response.ok) {
                console.error('Failed to complete walk', response.statusText);
                alert('산책 완료 처리에 실패했어요. 다시 시도해주세요.');
                return;
            }

            await fetchDogs();
        } catch (error) {
            console.error('Error completing walk', error);
            alert('산책 완료 처리 중 오류가 발생했어요.');
        }
    };

    const handleResetDog = async (dog: Dog) => {
        try {
            const response = await fetch(`http://localhost:4000/api/dogs/${dog.id}/reset`, {
                method: 'POST',
            });

            if (!response.ok) {
                console.error('Failed to reset dog', response.statusText);
                alert('상태를 되돌리는 데 실패했어요.');
                return;
            }

            await fetchDogs();
        } catch (error) {
            console.error('Error resetting dog', error);
            alert('상태를 되돌리는 중 오류가 발생했어요.');
        }
    };

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>유기견과 함께하는 산책</h1>
                    <p>사랑스러운 친구들과 행복한 시간을 보내요.</p>
                    <button
                        className="cta-button"
                        onClick={() => navigate('/reserve')}
                    >
                        지금 예약하기
                    </button>
                </div>
                <div className="hero-image">
                    <div className="product-showcase">🐶</div>
                </div>
            </section>

            {/* Available Dogs Only */}
            <section
                className="products-section"
                ref={productsSectionRef}
            >
                <h2>예약 가능한 친구들</h2>

                <div className="dog-grid">
                    {availableDogs.map((dog) => (
                        <DogCard
                            key={dog.id}
                            dog={dog}
                            onClick={handleDogClick}
                            onComplete={handleCompleteWalk}
                            onReset={handleResetDog}
                        />
                    ))}
                </div>
            </section>

            {/* Reservation Modal */}
            {showModal && selectedDog && (
                <ReservationModal dog={selectedDog} onClose={handleCloseModal} />
            )}
        </div>
    );
};
