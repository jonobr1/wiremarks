function dilute(component, amount) {
  return lerp(component, 255, amount);
}

function lerp(source, target, t) {
  return (target - source) * t + source;
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

export { dilute, lerp, stringToColor };