// a particle system for the object tracking
type Particle = {
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    update: () => void,
    draw: (ctx: CanvasRenderingContext2D) => void
}

class Particles {

    particles: Particle[];
    particleCount: number;
    particleMax: number;

    constructor() {
        this.particles = [];
        this.particleCount = 0;
        this.particleMax = 100;
    }
    addParticle(particle) {
        if (this.particleCount < this.particleMax) {
            this.particles.push(particle);
            this.particleCount++;
        }
    }
    update() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
                this.particleCount--;
            }
        }
    }
    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx);
        }
    }
}

export { Particles, Particle }