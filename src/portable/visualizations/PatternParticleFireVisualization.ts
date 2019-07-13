import * as Colors from "../base/Colors";
import * as Visualization from "../base/Visualization";

import { UnorderedRecycledSet } from "../../util/RecycledSet";

import AbstractVoronoiMapperVisualization from "./util/AbstractVoronoiMapperVisualization";

const NAME = "pattern:particleFire";

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

class PatternParticleFireVisualization extends AbstractVoronoiMapperVisualization {
  private numParticlesToAddRemainder = 0;
  private readonly maxDistance: number;
  private readonly particles: UnorderedRecycledSet<Particle>;
  private readonly baseHue: number;

  constructor(config: Visualization.Config) {
    super(config);
    this.particles = UnorderedRecycledSet.withObjectCreator(() => new Particle());
    this.maxDistance = Math.max(this.canvas.width, this.canvas.height) / 2 + MAX_RADIUS;
    this.baseHue = Math.floor(Math.random() * 360);
  }

  protected renderToCanvas(context: Visualization.FrameContext) {
    // add particles
    let numParticlesToAdd = this.numParticlesToAddRemainder + PARTICLES_PER_SECOND * context.elapsedSeconds;
    while (numParticlesToAdd >= 1) {
      const particle: Particle = this.particles.add();
      particle.distance = 0;
      particle.speed = Math.random() * (PARTICLE_MAX_SPEED - PARTICLE_MIN_SPEED) + PARTICLE_MIN_SPEED;
      particle.radius = Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS;
      particle.angleRadians = Math.random() * Math.PI * 2;
      particle.color = Colors.hsv(Math.pow(Math.random(), 2) * 60 + this.baseHue, 1, Math.random() * 0.3 + 0.7);
      numParticlesToAdd -= 1;
    }
    this.numParticlesToAddRemainder = numParticlesToAdd;

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
    this.particles.forEachAndFilter(particle => {
      particle.distance += context.elapsedSeconds * particle.speed;
      if (particle.distance >= this.maxDistance) {
        return false;
      } else {
        const x = cx + Math.sin(particle.angleRadians) * particle.distance;
        const y = cy + Math.cos(particle.angleRadians) * particle.distance;
        ctx.fillStyle = Colors.cssColor(particle.color);
        ctx.beginPath();
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        return true;
      }
    });
  }
}

const factory = new Visualization.Factory(NAME, PatternParticleFireVisualization);
export default factory;
