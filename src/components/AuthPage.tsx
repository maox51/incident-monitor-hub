
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, LogIn, UserPlus, Eye, EyeOff, Mail } from 'lucide-react';
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

  // Validar dominio empresarial
  const validateBusinessEmail = (email: string) => {
    const businessDomains = [
      '@empresa.com', '@company.com', '@corp.com', '@organizacion.com',
      '@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com' // Permitir también dominios comunes para testing
    ];
    
    return businessDomains.some(domain => email.toLowerCase().includes(domain.toLowerCase()));
  };

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
    
    if (!validateBusinessEmail(signupData.email)) {
      toast.error('Por favor utiliza un email corporativo válido.');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (signupData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.');
      return;
    }

    // Validar complejidad de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(signupData.password)) {
      toast.error('La contraseña debe contener al menos una mayúscula, una minúscula y un número.');
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
          toast.error('La contraseña debe tener al menos 8 caracteres.');
        } else {
          toast.error('Error al registrarse: ' + error.message);
        }
      } else {
        toast.success('¡Registro exitoso! Revisa tu email corporativo para confirmar tu cuenta.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-orange-500 p-3 rounded-full shadow-lg">
              <AlertTriangle className="text-white h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Sistema de Incidencias
            </h1>
          </div>
          <p className="text-blue-100">
            Plataforma Corporativa de Gestión de Incidencias
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-800">Acceso al Sistema</CardTitle>
            <CardDescription className="text-gray-600">
              Inicia sesión con tu cuenta corporativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
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
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-700 font-medium">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Corporativo
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-700 font-medium">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword.login ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Tu contraseña"
                        className="h-11 pr-10"
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
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                    disabled={loading.login}
                  >
                    {loading.login ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-gray-700 font-medium">Nombre Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Tu nombre completo"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Corporativo
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      className="h-11"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Utiliza tu email corporativo oficial
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword.signup ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                        className="h-11 pr-10"
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
                    <p className="text-xs text-gray-500">
                      Debe incluir mayúsculas, minúsculas y números
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        placeholder="Repite tu contraseña"
                        className="h-11 pr-10"
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
                    className="w-full h-11 bg-green-600 hover:bg-green-700"
                    disabled={loading.signup}
                  >
                    {loading.signup ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-blue-100">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="font-medium">Información del Sistema</p>
            <p>Rol por defecto: Monitor</p>
            <p>Contacta al administrador para cambios de rol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
