import { Link } from 'react-router-dom';
import './Header.css';

export const Header = () => {
    return (
        <header className="header">
            <Link to="/" className="logo">🐕 Walk with Mung</Link>
            <nav className="nav">
                <Link to="/schedule">예약 확인</Link>
                <Link to="/reserved">예약 대기</Link>
                <Link to="/walking">산책 중</Link>
                <Link to="/completed">산책 완료</Link>
            </nav>
        </header>
    );
};

