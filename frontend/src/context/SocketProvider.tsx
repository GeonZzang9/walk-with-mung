import { createContext, useContext, ReactNode } from 'react';

interface SocketContextType {
    // Socket 관련 메서드들을 여기에 추가할 수 있습니다
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    // Socket 로직을 여기에 구현할 수 있습니다
    const value: SocketContextType = {};

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
