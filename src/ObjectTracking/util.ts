type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type EcoObject = {
    name: string;
    ecoTag: string;
    score: number;
};

type Point = {
    x: number;
    y: number;
};

const checkInside = (x: number, y: number, rect: Rect) => {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
};

const checkInsideRadius = (point1: Point, point2: Point, radius: number) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)) <= radius;
}

const checkOverlap = (rect1: Rect, rect2: Rect) => {
    return (
        checkInside(rect1.x, rect1.y, rect2) ||
        checkInside(rect1.x + rect1.width, rect1.y, rect2) ||
        checkInside(rect1.x, rect1.y + rect1.height, rect2) ||
        checkInside(rect1.x + rect1.width, rect1.y + rect1.height, rect2)
    );
};

export { Rect, EcoObject, checkInside, checkOverlap, checkInsideRadius}