function dilute(component, amount) {
  return lerp(component, 255, amount);
}

function lerp(source, target, t) {
  return (target - source) * t + source;
}

export { dilute, lerp };