import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: ({ title, description, variant = "default", ...props }) => {
      const message = description || title;
      
      switch (variant) {
        case "destructive":
          return sonnerToast.error(title, { description });
        case "success":
          return sonnerToast.success(title, { description });
        case "warning":
          return sonnerToast.warning(title, { description });
        default:
          return sonnerToast(title, { description });
      }
    },
    dismiss: sonnerToast.dismiss,
  };
}

export { sonnerToast as toast };
