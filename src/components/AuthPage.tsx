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
import mountainBackground from '@/assets/mountain-background.jpg';
import logoEsva from '@/assets/logo-esva.png';

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
      '@grupoesvasa.com'
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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Mountain Background */}
      <div className="absolute inset-0">
        <img 
          src={mountainBackground}
          alt="Mountain landscape"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-slate-900/70 backdrop-blur-sm"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <img 
                src={logoEsva}
                alt="GRUPO ESVA"
                className="h-24 w-24 rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Sistema de Monitoreo
          </h1>
          <p className="text-blue-200 text-lg">Casino Integral</p>
        </div>

        <Card className="backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-lg">
          <CardContent className="p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="Ingresa tu email"
                      className="h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showPassword.login ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Ingresa tu contraseña"
                        className="h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700 pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                      >
                        {showPassword.login ? <EyeOff className="h-4 w-4 text-gray-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-white">
                      <input type="checkbox" className="mr-2 rounded bg-white/20 border-white/30" />
                      Recordarme
                    </label>
                    <a href="#" className="text-white hover:text-white/80 underline">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-white text-gray-800 hover:bg-white/90 font-medium text-base rounded-md shadow-lg mt-6"
                    disabled={loading.login}
                  >
                    {loading.login ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>

                  <div className="text-center mt-6">
                    <span className="text-white text-sm">
                      ¿No tienes una cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const signupTab = document.querySelector('[data-value="signup"]') as HTMLButtonElement;
                          signupTab?.click();
                        }}
                        className="text-white underline hover:text-white/80 font-medium"
                      >
                        Regístrate
                      </button>
                    </span>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" data-value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      placeholder="Nombre Completo"
                      className="h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      placeholder="Email Corporativo"
                      className="h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700"
                      required
                    />
                    <p className="text-xs text-white/80">
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
                        className="pr-12 h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, signup: !showPassword.signup })}
                      >
                        {showPassword.signup ? <EyeOff className="h-4 w-4 text-gray-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
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
                        className="pr-12 h-12 text-base border-0 bg-white/80 backdrop-blur-sm rounded-md placeholder:text-gray-500 text-gray-700"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4 text-gray-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-white text-gray-800 hover:bg-white/90 font-medium text-base rounded-md shadow-lg mt-6"
                    disabled={loading.signup}
                  >
                    {loading.signup ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>

                  <div className="text-center mt-4">
                    <span className="text-white text-sm">
                      ¿Ya tienes una cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          const loginTab = document.querySelector('[data-value="login"]') as HTMLButtonElement;
                          loginTab?.click();
                        }}
                        className="text-white underline hover:text-white/80 font-medium"
                      >
                        Iniciar Sesión
                      </button>
                    </span>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AuthPage;
