import { useParams } from 'react-router-dom';

export const RoomPage = () => {
    const { roomUid } = useParams();

    return (
        <div style={{ padding: '20px' }}>
            <h1>Room 페이지</h1>
            {roomUid ? (
                <p>Room UID: {roomUid}</p>
            ) : (
                <p>모든 Room 목록 (준비 중)</p>
            )}
        </div>
    );
};
