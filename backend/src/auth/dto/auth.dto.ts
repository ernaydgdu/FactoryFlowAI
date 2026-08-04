export class LoginDto {
  email!: string;
  password!: string;
}

export class RegisterDto {
  email!: string;
  password!: string;
  fullName!: string;
  factoryId?: string;
}

export class CreateUserDto {
  email!: string;
  password!: string;
  fullName!: string;
  role?: string;
  factoryId?: string;
}

export class UpdateUserDto {
  fullName?: string;
  role?: string;
  factoryId?: string;
  password?: string;
}
