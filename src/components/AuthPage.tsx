import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, LogIn, UserPlus, Eye, EyeOff, Mail, Shield } from 'lucide-react';
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

  // Validar dominio empresarial - Dominios corporativos específicos
  const validateBusinessEmail = (email: string) => {
    // Dominios corporativos permitidos
    const businessDomains = [
      '@grupoesvasa.com',
      '@empresa.com', 
      '@company.com', 
      '@corp.com', 
      '@organizacion.com',
      '@corporativo.com', 
      '@business.com', 
      '@industria.com', 
      '@casino.com',
      '@monitoreo.com', 
      '@seguridad.com', 
      '@operaciones.com'
    ];
    
    // Verificar que el email termine con uno de los dominios corporativos
    return businessDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
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
      toast.error('Por favor utiliza un email corporativo válido. Dominios permitidos: @grupoesvasa.com, @empresa.com, etc.');
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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541855244-513b7c15023c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      
      {/* Overlay para mejorar legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/85 to-slate-800/90" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full shadow-2xl">
              <Shield className="text-white h-6 w-6 md:h-8 md:w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Sistema de Monitoreo
            </h1>
          </div>
          <p className="text-blue-100 text-sm md:text-base">
            Plataforma Corporativa de Gestión de Incidencias - Casino
          </p>
        </div>

        <Card className="backdrop-blur-lg bg-white/95 border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl text-gray-800 flex items-center justify-center gap-2">
              <AlertTriangle className="text-orange-500 h-5 w-5 md:h-6 md:w-6" />
              Acceso Seguro
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm md:text-base">
              Inicia sesión con tu cuenta corporativa
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2 text-xs md:text-sm">
                  <LogIn className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Login</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 text-xs md:text-sm">
                  <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Registrarse</span>
                  <span className="sm:hidden">Registro</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 md:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-700 font-medium text-sm md:text-base">
                      <Mail className="inline h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Email Corporativo
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-700 font-medium text-sm md:text-base">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword.login ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Tu contraseña"
                        className="h-10 md:h-11 pr-10 text-sm md:text-base"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                      >
                        {showPassword.login ? <EyeOff className="h-3 w-3 md:h-4 md:w-4" /> : <Eye className="h-3 w-3 md:h-4 md:w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 md:h-11 bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
                    disabled={loading.login}
                  >
                    {loading.login ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 md:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-gray-700 font-medium text-sm md:text-base">
                      Nombre Completo
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Tu nombre completo"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium text-sm md:text-base">
                      <Mail className="inline h-3 w-3 md:h-4 md:w-4 mr-2" />
                      Email Corporativo
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="usuario@empresa.com"
                      className="h-10 md:h-11 text-sm md:text-base"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Utiliza tu email corporativo oficial terminado en .com
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium text-sm md:text-base">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword.signup ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        placeholder="Mínimo 8 caracteres"
                        className="h-10 md:h-11 pr-10 text-sm md:text-base"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, signup: !showPassword.signup })}
                      >
                        {showPassword.signup ? <EyeOff className="h-3 w-3 md:h-4 md:w-4" /> : <Eye className="h-3 w-3 md:h-4 md:w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Debe incluir mayúsculas, minúsculas y números
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-700 font-medium text-sm md:text-base">
                      Confirmar Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPassword.confirm ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        placeholder="Repite tu contraseña"
                        className="h-10 md:h-11 pr-10 text-sm md:text-base"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      >
                        {showPassword.confirm ? <EyeOff className="h-3 w-3 md:h-4 md:w-4" /> : <Eye className="h-3 w-3 md:h-4 md:w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 md:h-11 bg-green-600 hover:bg-green-700 text-sm md:text-base"
                    disabled={loading.signup}
                  >
                    {loading.signup ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-blue-100">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4">
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
