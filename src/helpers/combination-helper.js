export const combination = (array, minimum, maximum) => {
  const min = minimum || 1;
  const max = maximum || min;
  const all = [];

  const combine = (counter, src, got, all) => {
    if (counter === 0) {
      if (got.length > 0) {
        all[all.length] = got;
      }
      return;
    }

    for (let j = 0; j < src.length; j++) {
      combine(counter - 1, src.slice(j + 1), got.concat([src[j]]), all);
    }
  };

  for (let i = min; i < array.length; i++) {
    combine(i, array, [], all);
  }

  if (array.length === max) {
    all.push(array);
  }

  return all.filter((result) => result.length === min);
};
