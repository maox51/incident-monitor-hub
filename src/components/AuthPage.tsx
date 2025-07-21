
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">SI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Incidencias</h1>
          <p className="text-gray-600 mt-2">Accede a tu cuenta o crea una nueva</p>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Iniciar Sesión
                </CardTitle>
                <CardDescription>
                  Ingresa con tu usuario o email y contraseña
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Usuario o Email</Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Tu usuario o email"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData(prev => ({ ...prev, identifier: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || loading}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Crear Cuenta
                </CardTitle>
                <CardDescription>
                  Completa la información para crear tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu.email@empresa.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña segura"
                        value={registerData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {registerData.password && (
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-sm ${passwordValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          <span>Requisitos de contraseña segura:</span>
                        </div>
                        <ul className="text-xs space-y-1 ml-6">
                          <li className={registerData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                            ✓ Al menos 8 caracteres
                          </li>
                          <li className={/[A-Z]/.test(registerData.password) ? 'text-green-600' : 'text-red-600'}>
                            ✓ Una letra mayúscula
                          </li>
                          <li className={/[a-z]/.test(registerData.password) ? 'text-green-600' : 'text-red-600'}>
                            ✓ Una letra minúscula
                          </li>
                          <li className={/\d/.test(registerData.password) ? 'text-green-600' : 'text-red-600'}>
                            ✓ Un número
                          </li>
                          <li className={/[!@#$%^&*(),.?":{}|<>]/.test(registerData.password) ? 'text-green-600' : 'text-red-600'}>
                            ✓ Un carácter especial
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirma tu contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {registerData.confirmPassword && registerData.password !== registerData.confirmPassword && (
                      <p className="text-red-600 text-xs">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
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
  );
};

export default AuthPage;
