import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, LogIn, UserPlus, Eye, EyeOff, Mail, Shield, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { toast } from 'sonner';

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const { logAction } = useAuditLog();
  
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

  const validateBusinessEmail = (email: string) => {
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
    
    return businessDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading({ ...loading, login: true });

    try {
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        await logAction('login_failed', 'auth', null, { 
          email: loginData.email,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          toast.error('Error al iniciar sesión: ' + error.message);
        }
      } else {
        await logAction('login_success', 'auth', null, { 
          email: loginData.email,
          timestamp: new Date().toISOString()
        });
        
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
        await logAction('signup_failed', 'auth', null, { 
          email: signupData.email,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado. Intenta iniciar sesión.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          toast.error('La contraseña debe tener al menos 8 caracteres.');
        } else {
          toast.error('Error al registrarse: ' + error.message);
        }
      } else {
        await logAction('signup_success', 'auth', null, { 
          email: signupData.email,
          fullName: signupData.fullName,
          timestamp: new Date().toISOString()
        });

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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0">
        <svg 
          className="w-full h-full object-cover" 
          viewBox="0 0 800 600" 
          preserveAspectRatio="xMidYMid slice"
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 20%, #06b6d4 40%, #10b981 60%, #84cc16 80%, #eab308 100%)'
          }}
        >
          <defs>
            <pattern id="geometric" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <polygon points="20,10 40,30 20,50 0,30" fill="rgba(255,255,255,0.05)" />
              <polygon points="60,10 80,30 60,50 40,30" fill="rgba(255,255,255,0.08)" />
              <polygon points="40,40 60,60 40,80 20,60" fill="rgba(255,255,255,0.03)" />
              <polygon points="80,40 100,60 80,80 60,60" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric)" />
          
          <polygon points="0,0 200,100 0,200" fill="rgba(30,58,138,0.3)" />
          <polygon points="800,0 600,150 800,300" fill="rgba(59,130,246,0.2)" />
          <polygon points="200,600 400,450 600,600" fill="rgba(6,182,212,0.25)" />
          <polygon points="800,400 650,500 800,600" fill="rgba(16,185,129,0.2)" />
          <polygon points="0,400 150,500 0,600" fill="rgba(132,204,22,0.15)" />
        </svg>
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border border-white/30">
              <Users className="text-white h-12 w-12" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-white mb-2">
            Member Login
          </h1>
          <p className="text-white/80 text-base">
            Sistema de Monitoreo - Casino
          </p>
        </div>

        <Card className="backdrop-blur-lg bg-white/95 border-0 shadow-2xl rounded-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger value="login" className="text-sm">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        placeholder="Username"
                        className="pl-12 h-12 text-base border border-gray-300 rounded-md bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <Input
                        type={showPassword.login ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Password"
                        className="pl-12 pr-12 h-12 text-base border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                      >
                        {showPassword.login ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-600">
                      <input type="checkbox" className="mr-2" />
                      Remember me
                    </label>
                    <a href="#" className="text-blue-600 hover:underline">
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-base rounded-md shadow-lg"
                    disabled={loading.login}
                  >
                    {loading.login ? 'Iniciando sesión...' : 'LOGIN'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Nombre Completo"
                      className="h-12 text-base border border-gray-300 rounded-md bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="Email Corporativo"
                      className="h-12 text-base border border-gray-300 rounded-md bg-white"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Utiliza tu email corporativo oficial
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword.signup ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        placeholder="Contraseña (mínimo 8 caracteres)"
                        className="pr-12 h-12 text-base border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, signup: !showPassword.signup })}
                      >
                        {showPassword.signup ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword.confirm ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        placeholder="Confirmar Contraseña"
                        className="pr-12 h-12 text-base border border-gray-300 rounded-md bg-white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium text-base rounded-md shadow-lg"
                    disabled={loading.signup}
                  >
                    {loading.signup ? 'Registrando...' : 'CREAR CUENTA'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white/80">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="font-medium mb-1">Sistema de Monitoreo Casino</p>
            <p>Rol por defecto: Monitor</p>
            <p>Contacta al administrador para cambios de rol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
