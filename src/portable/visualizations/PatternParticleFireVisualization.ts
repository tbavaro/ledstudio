import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const MIN_RADIUS = 10;
const MAX_RADIUS = 30;
const PARTICLES_PER_SECOND = 70;
const PARTICLE_MIN_SPEED = 100;
const PARTICLE_MAX_SPEED = 300;

class Particle {
  public distance: number = 0;
  public speed: number = 0; // distance / second
  public radius: number = 0;
  public angleRadians: number = 0;
  public color: Colors.Color = Colors.BLACK;
}

class Recycler<T> {
  private readonly deadObjects: T[];
  private readonly createNewObject: () => T;

  constructor(createNewObject: () => T) {
    this.deadObjects = [];
    this.createNewObject = createNewObject;
  }

  public getOrCreate(): T {
    return this.deadObjects.pop() || this.createNewObject();
  }

  public recycle(object: T) {
    this.deadObjects.push(object);
  }
}

export default class PatternParticleFireVisualization extends AbstractVoronoiMapperVisualization {
  private numParticlesRemainder = 0;
  private readonly maxDistance: number;
  private readonly particles: Set<Particle>;
  private readonly particleSource: Recycler<Particle>;

  constructor(config: Visualization.Config) {
    super(config);
    this.particleSource = new Recycler(() => new Particle());
    this.particles = new Set();
    this.maxDistance = Math.max(this.canvas.width, this.canvas.height) / 2 + MAX_RADIUS;
  }

  protected renderToCanvas(context: Visualization.FrameContext) {
    // add particles
    let numParticles = this.numParticlesRemainder + PARTICLES_PER_SECOND * context.elapsedMillis / 1000;
    while (numParticles >= 1) {
      const particle: Particle = this.particleSource.getOrCreate();
      particle.distance = 0;
      particle.speed = Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + PARTICLE_MIN_SPEED;
      particle.radius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
      particle.angleRadians = Math.random() * Math.PI * 2;
      particle.color = Colors.hsv(Math.pow(Math.random(), 2) * 60, 1, Math.random() * 0.3 + 0.7);
      this.particles.add(particle);
      numParticles -= 1;
    }
    this.numParticlesRemainder = numParticles;

    // clear
    const canvas = this.canvas;
    const ctx = this.canvasContext;
    ctx.fillStyle = Colors.cssColor(Colors.hsv(0, 1, 0.1));
    ctx.globalCompositeOperation = "source-over";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw particles
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.globalCompositeOperation = "lighter";
    const newDeadParticles: Particle[] = [];
    this.particles.forEach(particle => {
      particle.distance += context.elapsedMillis / 1000 * particle.speed;
      if (particle.distance >= this.maxDistance) {
        newDeadParticles.push(particle);
      } else {
        const x = cx + Math.sin(particle.angleRadians) * particle.distance;
        const y = cy + Math.cos(particle.angleRadians) * particle.distance;
        ctx.fillStyle = Colors.cssColor(particle.color);
        ctx.beginPath();
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    newDeadParticles.forEach(p => {
      this.particles.delete(p);
      this.particleSource.recycle(p);
    });
  }
}