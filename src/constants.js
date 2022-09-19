const unit = 200;

const dashes = [unit * 0.03, unit * 0.045]
dashes.offset = 0;

const textStyles = {
  family: '"Inter", sans-serif',
  size: unit * 0.1,
  leading: unit * 0.12,
  fill: 'white'
};

export { unit, dashes, textStyles };