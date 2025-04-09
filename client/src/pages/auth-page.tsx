
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music2 } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    try {
      const res = await fetch('/api/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Password reset instructions have been sent to your email"
        });
        setShowResetPassword(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request password reset",
        variant: "destructive"
      });
    }
  };

  // Register form
  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Handle register submission
  const onRegisterSubmit = (values: z.infer<typeof insertUserSchema>) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left column - Auth form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your music library
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form 
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
                      </Button>
                      {!showResetPassword && (
                        <Button variant="link" onClick={() => setShowResetPassword(true)}>Forgot Password?</Button>
                      )}
                      {showResetPassword && (
                        <>
                          <Input type="email" placeholder="Enter your email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                          <Button onClick={handleResetPassword}>Reset Password</Button>
                          <Button variant="link" onClick={() => setShowResetPassword(false)}>Cancel</Button>
                        </>
                      )}
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("register")}
                  >
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>
                    Sign up to start using JamVault
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form 
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)} 
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="How you'll appear to others" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerForm.formState.isSubmitting}
                      >
                        {registerForm.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Register
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button 
                    variant="link" 
                    onClick={() => setActiveTab("login")}
                  >
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/80 to-primary/30 items-center justify-center p-8">
        <div className="max-w-md text-white">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <img 
                src="/src/assets/jamvault-logo.png" 
                alt="JamVault Logo" 
                className="h-8 w-8 object-contain" 
              />
            </div>
            <h1 className="text-2xl font-bold ml-3">JamVault</h1>
          </div>

          <h2 className="text-3xl font-bold mb-4">Your Personal Vault of Vibes</h2>
          <p className="text-lg mb-6">
            Upload, organize, and enjoy your music collection in one place.
            Create playlists, shuffle your favorites, and take control of your
            listening experience.
          </p>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p>Upload your MP3 files and manage your personal library</p>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p>Create playlists and organize your music collection</p>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <p>Enjoy seamless playback even when navigating between pages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
