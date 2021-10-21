export function distance(a, b)
{
    return ((a.x - b.x)**2 + (a.y - b.y)**2) ** 0.5;
}

export function centerpoint(data)
{
    return {
        x: data.x + data.width * 50,
        y: data.y + data.height * 50
    };
}

export function closer(a, b, dst)
{
    let aDist = (a.x - dst.x)**2 + (a.y - dst.y)**2;
    let bDist = (b.x - dst.x)**2 + (b.y - dst.y)**2;
    if (aDist <= bDist)
    {
        return a;
    }
    else
    {
        return b;
    }
}

export function farther(a, b, dst)
{
    let aDist = (a.x - dst.x)**2 + (a.y - dst.y)**2;
    let bDist = (b.x - dst.x)**2 + (b.y - dst.y)**2;
    if (aDist >= bDist)
    {
        return a;
    }
    else
    {
        return b;
    }
}
