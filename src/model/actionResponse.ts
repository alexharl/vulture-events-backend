export class ActionResponse<T> {
  success = false;
  message: string | undefined = undefined;
  data: T | null | undefined;

  static Error(msg?: string) {
    return new ActionResponse().errored(msg);
  }

  static Data<T>(data: T) {
    return new ActionResponse<T>().succeeded(data);
  }

  status(ok: boolean) {
    this.success = ok;
    return this;
  }

  errored(msg?: string) {
    msg && (this.message = msg);
    return this.status(false);
  }

  succeeded(data: T) {
    this.data = data;
    return this.status(true);
  }
}
