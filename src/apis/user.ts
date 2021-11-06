export interface User {
  name: string;
  age: number;
}

interface Response<T = any> {
  code: number;
  msg: string;
  data?: T;
}

export async function getUser(): Promise<Response<User>> {
  const user: User = {
    name: "jack",
    age: 18,
  };
  return {
    code: 0,
    msg: "ok",
    data: user,
  };
}

export async function updateUser(user: User): Promise<Response<User>> {
  return {
    code: 0,
    msg: "ok",
    data: user,
  };
}
