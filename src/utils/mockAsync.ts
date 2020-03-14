export default async function<T>(val: T, ms: number = 1000): Promise<T> {
  return new Promise(res => setTimeout(() => res(val), ms));
}