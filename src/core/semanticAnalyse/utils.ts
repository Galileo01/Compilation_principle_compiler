
//深度
export function deepClone<T>(obj: unknown) {
  let objClone = Array.isArray(obj) ? [] : {};
  if (obj && typeof obj === 'object') {
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        objClone[key] = deepClone(obj[key]);
      } else {
        objClone[key] = obj[key]
      }
    }
  }
  return objClone as T;
}

