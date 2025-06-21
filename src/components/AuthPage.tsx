
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const [showPassword, setShowPassword] = useState({
    login: false,
    signup: false,
    confirm: false
  });

  const [loading, setLoading] = useState({
    login: false,
    signup: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ ...loading, login: true });

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          toast.error('Error al iniciar sesión: ' + error.message);
        }
      } else {
        toast.success('¡Bienvenido! Sesión iniciada correctamente.');
      }
    } catch (error) {
      toast.error('Error inesperado al iniciar sesión.');
    } finally {
      setLoading({ ...loading, login: false });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (signupData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading({ ...loading, signup: true });

    try {
      const { error } = await signUp(
        signupData.email, 
        signupData.password, 
        signupData.fullName
      );
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error('La contraseña debe tener al menos 6 caracteres.');
        } else {
          toast.error('Error al registrarse: ' + error.message);
        }
      } else {
        toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        setSignupData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: ''
        });
      }
    } catch (error) {
      toast.error('Error inesperado al registrarse.');
    } finally {
      setLoading({ ...loading, signup: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="text-orange-500 h-8 w-8" />
            <h1 className="text-2xl font-bold text-gray-900">
              Sistema de Incidencias
            </h1>
          </div>
          <p className="text-gray-600">
            Accede a tu cuenta para gestionar incidencias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Autenticación</CardTitle>
            <CardDescription>
              Inicia sesión o registra una nueva cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword.login ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Tu contraseña"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                      >
                        {showPassword.login ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading.login}
                  >
                    {loading.login ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo (Opcional)</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword.signup ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, signup: !showPassword.signup })}
                      >
                        {showPassword.signup ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        placeholder="Repite tu contraseña"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading.signup}
                  >
                    {loading.signup ? 'Registrando...' : 'Registrarse'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Rol por defecto: Monitor</p>
          <p>Contacta al administrador para cambiar tu rol</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
