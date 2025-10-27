declare module "react-hook-form" {
  export type FieldValues = any;
  export type SubmitHandler<T> = (data: T, e?: any) => unknown;
  export interface UseFormReturn<T> {
    register: any;
    handleSubmit: any;
    formState: { errors: any; isSubmitting: boolean };
    setValue: any;
    setFocus: any;
    watch: any;
    reset: any;
  }
  export function useForm<T = FieldValues>(args?: any): UseFormReturn<T>;
}
