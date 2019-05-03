export function fillArray<T>(size: number, func: (index: number) => T): T[] {
  const output = new Array<T>(size);
  for (let i = 0; i < size; ++i) {
    output[i] = func(i);
  }
  return output;
}

export function updateValues<T>(arr: T[], func: (oldValue: T) => T) {
  for (let i = 0; i < arr.length; ++i) {
    arr[i] = func(arr[i]);
  }
}
