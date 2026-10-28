import { toast } from "react-toastify";

export function showToast(
  type: "success" | "error" | "info" | "warning",
  message: string,
) {
  toast[type](message);
}
