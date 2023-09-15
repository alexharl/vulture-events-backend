/**
 * This class is used to standardize the return values of actions. It can be used to return data or an error message.
 */
export class ActionResponse<T> {
  success = false;
  message: string | undefined = undefined;
  data: T | null | undefined;

  /**
   * Create a new ActionResponse with a success of false
   */
  static Error(msg?: string) {
    return new ActionResponse().errored(msg);
  }

  /**
   * Create a new ActionResponse with a success of true
   * and the given data.
   */
  static Data<T>(data: T) {
    return new ActionResponse<T>().succeeded(data);
  }

  /**
   * Set the success status to a given boolean value.
   */
  status(ok: boolean) {
    this.success = ok;
    return this;
  }

  /**
   * Set the success status to false and optionally set
   * the message.
   */
  errored(msg?: string) {
    msg && (this.message = msg);
    return this.status(false);
  }

  /**
   * Set the success status to true and set the data.
   */
  succeeded(data: T) {
    this.data = data;
    return this.status(true);
  }
}
