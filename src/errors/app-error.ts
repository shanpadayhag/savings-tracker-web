export class AppError extends Error {
  constructor(
    public title: string,
    public description: string,
  ) {
    super(description);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  public getDetails() {
    return {
      title: this.title,
      description: this.description,
    };
  }
}
