const canvas = document.getElementById('header-canvas');
const ctx = canvas.getContext('2d');
var cw;
var ch;

var visible = true;

var lastFrameTime;

class Vector
{
    constructor(newX, newY)
    {
        this.x = newX;
        this.y = newY;
    }
    add(v)
    {
        return new Vector(this.x + v.x, this.y + v.y);
    }
    subtract(v)
    {
        return new Vector(this.x - v.x, this.y - v.y);
    }
    multiply(s)
    {
        return new Vector(this.x * s, this.y * s);
    }
    divide(s)
    {
        return new Vector(this.x / s, this.y / s);
    }
    magnitude()
    {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
    normalize()
    {
        return this.divide(this.magnitude());
    }
}

class Snake
{
    constructor(segmentCount, segmentDistance)
    {
        this.pos = new Vector(segmentCount*segmentDistance, 20);
        this.vel = new Vector(0, 0);
        this.trackingFood = false;
        this.targetPos = new Vector(0, 0);
        this.changeRandomGoal = 0.005;
        this.maxSpeed = 100;
        this.col = '#446644';
        this.eyesCol = '#121216'
        this.tongueCol = '#664444'
        this.width = 20;
        this.segmentDistance = segmentDistance;
        this.segments = new Array();
        for (let i = 0; i < segmentCount; i++)
        {
            this.segments.push(new Vector(this.pos.x - (segmentDistance*i), this.pos.y));
        }
    }

    // messy bespoke code for drawing a snake face
    draw_face()
    {
        var offset = this.vel.normalize();
        var offsetEyes = new Vector((offset.x*Math.cos(Math.PI/2)) + (offset.y*Math.sin(Math.PI/2)), -(offset.x*Math.sin(Math.PI/2)) + (offset.y*Math.cos(Math.PI/2)));
        var eyeSize = 3;
        var eyeSeparation = 6;
        draw_circle(this.segments[0].x - offsetEyes.x*eyeSeparation, this.segments[0].y - offsetEyes.y*eyeSeparation, this.eyesCol, eyeSize);
        draw_circle(this.segments[0].x + offsetEyes.x*eyeSeparation, this.segments[0].y + offsetEyes.y*eyeSeparation, this.eyesCol, eyeSize);
        ctx.strokeStyle = this.tongueCol;
        ctx.linecap = "round";
        ctx.lineWidth = 3;
        ctx.beginPath();
        var tongueLength = 15;
        var forkLength = 5;
        ctx.moveTo(this.segments[0].x + offset.x*(this.width/2), this.segments[0].y + offset.y*(this.width/2));
        ctx.lineTo(this.segments[0].x + offset.x*tongueLength, this.segments[0].y + offset.y*tongueLength);
        var forkOffset = new Vector((offset.x*Math.cos(Math.PI/4)) + (offset.y*Math.sin(Math.PI/4)), -(offset.x*Math.sin(Math.PI/4)) + (offset.y*Math.cos(Math.PI/4)));
        ctx.moveTo(this.segments[0].x + offset.x*tongueLength, this.segments[0].y + offset.y*tongueLength);
        ctx.lineTo(this.segments[0].x + offset.x*tongueLength + forkOffset.x*forkLength, this.segments[0].y + offset.y*tongueLength + forkOffset.y*forkLength);
        var forkOffset = new Vector((offset.x*Math.cos(-Math.PI/4)) + (offset.y*Math.sin(-Math.PI/4)), -(offset.x*Math.sin(-Math.PI/4)) + (offset.y*Math.cos(-Math.PI/4)));
        ctx.moveTo(this.segments[0].x + offset.x*tongueLength, this.segments[0].y + offset.y*tongueLength);
        ctx.lineTo(this.segments[0].x + offset.x*tongueLength + forkOffset.x*forkLength, this.segments[0].y + offset.y*tongueLength + forkOffset.y*forkLength);
        ctx.stroke();
    }

    draw_segments()
    {
        ctx.strokeStyle = this.col;
        ctx.lineCap = "round";
        ctx.lineJoin = 'round';
        ctx.lineWidth = this.width;
        for (let i = 1; i < this.segments.length; i++)
        {
            ctx.beginPath();
            ctx.moveTo(this.segments[i-1].x, this.segments[i-1].y);
            ctx.lineTo(this.segments[i].x, this.segments[i].y);
            if (i > 10)
            {
                ctx.lineWidth = this.width - (i-10)*2 + 2;
            }
            ctx.stroke();
        }
    }

    draw()
    {
        this.draw_segments();
        this.draw_face();
    }

    update_segments()
    {
        for (let i = 1; i < this.segments.length; i++)
        {
            var segmentDiff = this.segments[i-1].subtract(this.segments[i]);
            var segmentDist = segmentDiff.magnitude();
            if (segmentDist > this.segmentDistance)
            {
                var movement = segmentDiff.normalize().multiply(this.segmentDistance);
                this.segments[i] = this.segments[i-1].subtract(movement);
            }   
        }
    }

    random_target()
    {
        this.targetPos = new Vector(Math.random() * cw, Math.random() * ch);
    }

    seek()
    {
        var desiredVel = this.targetPos.subtract(this.segments[0]);
        desiredVel = desiredVel.normalize();
        desiredVel = desiredVel.multiply(this.maxSpeed);

        var steering = desiredVel.subtract(this.vel);

        return steering;
    }
}

var snake = new Snake(20, 15);

var foodPos = new Array();
var lastFrameFoodCount = 0;

function get_canvas_height()
{
    cw = canvas.offsetWidth;
    canvas.width = cw;
    ch = canvas.offsetHeight;
    canvas.height = ch;
}

function draw_circle(xpos, ypos, col, radius)
{
    ctx.beginPath();
    ctx.arc(xpos, ypos, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = col;
    ctx.fill();
}

function add_food(xpos, ypos)
{
    if (foodPos.length < 10)
    {
        foodPos.push(new Vector(xpos, ypos));
    }
}

function update_game(delta)
{
    for (let i = 0; i < foodPos.length; i++)
    {
        if (snake.segments[0].subtract(foodPos[i]).magnitude() < snake.width)
        {
            foodPos.splice(i, 1);
            i--;
        }
    }
    if (foodPos.length > 0)
    {
        if (foodPos.length != lastFrameFoodCount)
        {
            var closestIndex = 0;
            var closestLength = snake.segments[0].subtract(foodPos[0]).magnitude();
            for (let i = 1; i < foodPos.length; i++)
            {
                var thisLength = snake.segments[0].subtract(foodPos[i]).magnitude();
                if (thisLength < closestLength)
                {
                    closestLength = thisLength;
                    closestIndex = i;
                }
            }
            snake.trackingFood = true;
            snake.targetPos = foodPos[closestIndex];
        }
    }
    else 
    {
        // if tracking food is true despite no more food positions it means snake just ate the last food
        // so a new random target is required
        if (snake.trackingFood)
        {
            snake.random_target();
            snake.trackingFood = false;
        }
        else
        {
            if (Math.random() < snake.changeRandomGoal)
            {
                snake.random_target();
            }
            else if (snake.segments[0].subtract(snake.targetPos).magnitude() < snake.width)
            {
                snake.random_target();
            }
        }
    }
    lastFrameFoodCount = foodPos.length;
    snake.vel = snake.vel.add(snake.seek().multiply(delta));
    if (snake.vel.magnitude() > snake.maxSpeed)
    {
        snake.vel = snake.vel.normalize().multiply(snake.maxSpeed);
    }

    snake.segments[0] = snake.segments[0].add(snake.vel.multiply(delta));
    snake.update_segments();
}

function draw_game()
{
    ctx.clearRect(0, 0, cw, ch);
    for (let i = 0; i < foodPos.length; i++)
    {
        draw_circle(foodPos[i].x, foodPos[i].y, '#121216', 5);
    }
    snake.draw();
}

function step()
{
    var frameTime = new Date();
    var delta = (frameTime - lastFrameTime)/1000;
    lastFrameTime = frameTime;

    // if the delta is very high, it can produce unintended results like the snake moving very far in one frame
    // this happens often when the tab is not visible because browsers won't run very many animation frames due to optimisation
    // the snake would often have disappeared when returning to the tab due to this quirk
    // hacky solution that's good enough for this usecase is just to skip running game logic if delta is super high
    if (delta < 1)
    {
        update_game(delta);
        draw_game();
    }

    requestAnimationFrame(step);
}

window.onload = function()
{
    lastFrameTime = new Date();
    get_canvas_height();
    snake.targetPos = new Vector(cw/2, ch/2);

    document.addEventListener('click', (e) => 
    {
        if (e.pageX < cw && e.pageY < ch)
        {
            add_food(e.pageX, e.pageY);
        }
    })

    requestAnimationFrame(step);
}

window.onresize = function()
{
    get_canvas_height();
}