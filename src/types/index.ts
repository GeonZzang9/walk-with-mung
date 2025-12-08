export type WalkStatus = 'available' | 'reserved' | 'walking' | 'completed';

export interface Dog {
    id: number;
    name: string;
    breed: string;
    age: number;
    description: string;
    status: WalkStatus;
    lastWalkTime?: string;
    currentWalkEnd?: string;
    image: string;
    reserverName?: string | null;
}
