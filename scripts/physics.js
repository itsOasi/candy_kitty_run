// Physics
class Physics {
    constructor(gravity = 0.5, debug = false, ctx = null) {
        this.grav = gravity;
        this.debug = debug;
        this.ctx = ctx; // pass in your canvas context if debugging visuals
    }
    applyGravity(unit){
        unit.vy += this.grav
    }
    applyVelocity(unit, dx=0, dy=0){
        unit.vx += dx
        unit.vy += dy
    }
    applyFriction(unit){
        unit.vx *= unit.fric
    }
    update(world) {
        world.forEach(obj => {
            if (!obj.isStatic) {
                console.log(obj.x, obj.y, obj.ref.vx, obj.ref.vy)
                // Move
                obj.x += obj.ref.vx;
                obj.y += obj.ref.vy;
                console.log(obj.x, obj.y)
                // Collisions
                this.checkAABBCollision(obj, world);

                // Sync back to original ref
                if (obj.ref) {
                    obj.ref.x = obj.x;
                    obj.ref.y = obj.y;
                    //obj.ref.vx = obj.vx;
                    //obj.ref.vy = obj.vy;
                }
            }
        });

        if (this.debug && this.ctx) {
            this.drawDebug(world);
        }
    }

    checkAABBCollision(unit, world) {
        world.forEach(other => {
            if (unit === other) return; // skip self
            if (this.AABB(unit, other)) {
                if (other.isStatic) {
                    this.resolveCollisions(unit, other);
                    unit._colliding = true;
                    other._colliding = true;
                }
            }
        });
    }

    AABB(a, b) {
        return (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
        );
    }

    resolveCollisions(unitA, unitB) {
        const dx = (unitA.x + unitA.w / 2) - (unitB.x + unitB.w / 2);
        const dy = (unitA.y + unitA.h / 2) - (unitB.y + unitB.h / 2);
        const overlapX = (unitA.w + unitB.w) / 2 - Math.abs(dx);
        const overlapY = (unitA.h + unitB.h) / 2 - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
            if (overlapX < overlapY) {
                // Horizontal collision
                unitA.x += dx > 0 ? overlapX : -overlapX;
                unitA.vx = 0;
            } else {
                // Vertical collision
                unitA.y += dy > 0 ? overlapY : -overlapY;
                unitA.vy = 0;
            }
        }
    }

    drawDebug(world) {
        this.ctx.save();
        world.forEach(obj => {
            this.ctx.strokeStyle = obj._colliding ? "red" : (obj.isStatic ? "blue" : "green");
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);

            // reset flag
            obj._colliding = false;
        });
        this.ctx.restore();
    }
}