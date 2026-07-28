export type ToastOptions = {
  message: string;
  type?: "info" | "success" | "error";
  duration?: number; // ms, 0 = persistent
};

type Listener = (t: ToastOptions) => void;

class ToastEmitter {
  private listeners: Listener[] = [];

  on(fn: Listener) {
    this.listeners.push(fn);
    return () => this.listeners.splice(this.listeners.indexOf(fn), 1);
  }

  emit(toast: ToastOptions) {
    this.listeners.forEach((l) => l(toast));
  }
}

export const toastEmitter = new ToastEmitter();

export const toast = {
  show(message: string, opts?: Partial<ToastOptions>) {
    toastEmitter.emit({
      message,
      type: opts?.type ?? "info",
      duration: opts?.duration ?? 4000,
    });
  },
  success(message: string, opts?: Partial<ToastOptions>) {
    this.show(message, { ...(opts || {}), type: "success" });
  },
  error(message: string, opts?: Partial<ToastOptions>) {
    this.show(message, { ...(opts || {}), type: "error" });
  },
  info(message: string, opts?: Partial<ToastOptions>) {
    this.show(message, { ...(opts || {}), type: "info" });
  },
};

export default toast;
