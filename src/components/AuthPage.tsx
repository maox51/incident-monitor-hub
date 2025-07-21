import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

const AuthPage = () => {
  const { signIn, signInWithUsername, signUp, loading, validatePassword } = useAuth();
  
  // Estados para login
  const [loginData, setLoginData] = useState({
    identifier: '', // puede ser username o email
    password: ''
  });
  
  // Estados para registro
  const [registerData, setRegisterData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] as string[] });

  const handlePasswordChange = (password: string) => {
    setRegisterData(prev => ({ ...prev, password }));
    const validation = validatePassword(password);
    setPasswordValidation(validation);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Primero intentar login con username
      const { error } = await signInWithUsername(loginData.identifier, loginData.password);
      
      if (error) {
        // Si falla, intentar con email directo
        const emailResult = await signIn(loginData.identifier, loginData.password);
        if (emailResult.error) {
          setError('Credenciales incorrectas');
          toast.error('Error al iniciar sesión');
        } else {
          toast.success('¡Bienvenido!');
        }
      } else {
        toast.success('¡Bienvenido!');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!passwordValidation.isValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      setIsLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(registerData.email, registerData.password, registerData.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email ya está registrado');
        } else {
          setError(error.message);
        }
        toast.error('Error al crear la cuenta');
      } else {
        toast.success('¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.');
        // Limpiar formulario
        setRegisterData({
          email: '',
          fullName: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      setError('Error al crear la cuenta');
      toast.error('Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#013974' }}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-32 w-6 h-6 bg-white/15 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-white/25 rounded-full animate-pulse delay-500"></div>
      <div className="absolute bottom-20 right-20 w-5 h-5 bg-white/20 rounded-full animate-pulse delay-1500"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Title Section */}
        <div className="text-center space-y-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative h-16 w-16 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-2xl">
              <Shield className="text-white h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Sistema de Incidencias
            </h1>
            <p className="text-white/80 text-lg drop-shadow-md">
              Accede de forma segura a tu cuenta
            </p>
          </div>
        </div>

        {/* Main Card with Glassmorphism */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
          <Card className="relative bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            
            <Tabs defaultValue="login" className="w-full relative z-10">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-xl text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="rounded-xl text-white/80 data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    Registrarse
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="login" className="m-0">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl text-white">
                    <User className="h-6 w-6" />
                    Iniciar Sesión
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Ingresa con tu usuario o email y contraseña
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="identifier" className="text-white/90 font-medium">
                        Usuario o Email
                      </Label>
                      <Input
                        id="identifier"
                        type="text"
                        placeholder="Tu usuario o email"
                        value={loginData.identifier}
                        onChange={(e) => setLoginData(prev => ({ ...prev, identifier: e.target.value }))}
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 transition-all duration-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="login-password" className="text-white/90 font-medium">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Tu contraseña"
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 pr-12 transition-all duration-300"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-300" />
                        <AlertDescription className="text-red-100">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white border border-white/20 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm shadow-lg" 
                      disabled={isLoading || loading}
                    >
                      {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="register" className="m-0">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl text-white">
                    <Mail className="h-6 w-6" />
                    Crear Cuenta
                  </CardTitle>
                  <CardDescription className="text-white/70 text-base">
                    Completa la información para crear tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-white/90 font-medium">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu.email@empresa.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 transition-all duration-300"
                        required
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="fullName" className="text-white/90 font-medium">
                        Nombre Completo
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 transition-all duration-300"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-white/90 font-medium">
                        Contraseña *
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña segura"
                          value={registerData.password}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 pr-12 transition-all duration-300"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {registerData.password && (
                        <div className="space-y-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className={`flex items-center gap-2 text-sm ${passwordValidation.isValid ? 'text-green-300' : 'text-yellow-300'}`}>
                            {passwordValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            <span className="font-medium">Requisitos de contraseña segura:</span>
                          </div>
                          <ul className="text-xs space-y-2 ml-6">
                            <li className={`flex items-center gap-2 ${registerData.password.length >= 8 ? 'text-green-300' : 'text-red-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${registerData.password.length >= 8 ? 'bg-green-300' : 'bg-red-300'}`}></div>
                              Al menos 8 caracteres
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(registerData.password) ? 'text-green-300' : 'text-red-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(registerData.password) ? 'bg-green-300' : 'bg-red-300'}`}></div>
                              Una letra mayúscula
                            </li>
                            <li className={`flex items-center gap-2 ${/[a-z]/.test(registerData.password) ? 'text-green-300' : 'text-red-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(registerData.password) ? 'bg-green-300' : 'bg-red-300'}`}></div>
                              Una letra minúscula
                            </li>
                            <li className={`flex items-center gap-2 ${/\d/.test(registerData.password) ? 'text-green-300' : 'text-red-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(registerData.password) ? 'bg-green-300' : 'bg-red-300'}`}></div>
                              Un número
                            </li>
                            <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) ? 'text-green-300' : 'text-red-300'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) ? 'bg-green-300' : 'bg-red-300'}`}></div>
                              Un carácter especial
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="text-white/90 font-medium">
                        Confirmar Contraseña *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirma tu contraseña"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-white/40 rounded-xl h-12 pr-12 transition-all duration-300"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70 hover:text-white rounded-xl"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                        <p className="text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" />
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>

                    {error && (
                      <Alert className="bg-red-500/20 border-red-400/30 backdrop-blur-sm rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-300" />
                        <AlertDescription className="text-red-100">{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white border border-white/20 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm shadow-lg" 
                      disabled={isLoading || loading || !passwordValidation.isValid || registerData.password !== registerData.confirmPassword}
                    >
                      {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
