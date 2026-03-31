export class UserSignupEvent {
  id: number;

  constructor(loginId: number) {
    this.id = loginId;
  }
}
