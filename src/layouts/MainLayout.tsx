import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import './MainLayout.css';

export const MainLayout = () => {
    return (
        <div className="main-layout">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};
