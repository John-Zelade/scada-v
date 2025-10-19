import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";

export function SignupForm({
  className,
  isSwitchForm = false,
  ...props
}: React.ComponentProps<"div"> & { isSwitchForm?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);

  const signupSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(30, "Username must be at most 30 characters long")
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must be at most 100 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
  });

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { reset, clearErrors } = form;

  useEffect(() => {
    clearErrors();
  }, [isSwitchForm]);

  //const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
     
    },
    onSuccess: () => {
      clearErrors();
      reset();
      alert("Registration successful! You can now log in.");
    },
    onError: (error: any) => {
      alert(`Error during signup: ${error.message}`);
    },
  });

  function handleSubmit(values: z.infer<typeof signupSchema>) {
    signupMutation.mutate(values);
  }

  function handleError(errors: any) {
    console.log("❌ Validation errors:", errors);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Enter your details below to get started with your new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="flex flex-col gap-6">
              <form
                onSubmit={form.handleSubmit(handleSubmit, handleError)}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-3 mb-1">
                  <Label htmlFor="username">Username</Label>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <>
                        <div>
                          <Input
                            type="text"
                            {...field}
                            id="username"
                            placeholder="Enter your username"
                          />
                        </div>
                        <FormMessage />
                      </>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <>
                          <div>
                            <Input
                              type={showPassword ? "text" : "password"}
                              {...field}
                              id="password"
                              placeholder="Enter your password"
                            />
                          </div>
                          <FormMessage />
                        </>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-4 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Signup
                  </Button>
                  <Button type="button" variant="outline" className="w-full">
                    Signup with Google
                  </Button>
                </div>
              </form>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
