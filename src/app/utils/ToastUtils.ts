import { toast } from 'react-toastify';

const toastTypes = {
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
};

export const showToast = (type: keyof typeof toastTypes, message: string) => {
    const toastFunction = toastTypes[type];
    if (toastFunction) {
        toastFunction(message);
    } else {
        console.error(`Toast type "${type}" is not defined.`);
    }
};