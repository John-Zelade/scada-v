import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { nanoid } from "nanoid";
import { Form, FormField, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
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
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";

export function LoginForm({
  className,
  isSwitchForm = false,
  ...props
}: React.ComponentProps<"div"> & { isSwitchForm?: boolean }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { clearErrors } = form;

  useEffect(() => {
    clearErrors();
  }, [isSwitchForm]);

  //const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      
    },
    onSuccess: async () => {
      alert("Login successful!");

      const token = nanoid();
    

      navigate({ to: "/" });
    },
    onError: (error: any) => {
      alert(`Login failed: ${error.message}`);
    },
  });

  function handleSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function handleError(errors: any) {
    console.log("❌ Validation errors:", errors);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="flex flex-col gap-6">
              <form
                onSubmit={form.handleSubmit(handleSubmit, handleError)}
                className="flex flex-col gap-4"
              >
                <div className="grid gap-3">
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
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
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
                    Login
                  </Button>
                  <Button type="button" variant="outline" className="w-full">
                    Login with Google
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
