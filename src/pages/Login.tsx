import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, FileText, Info, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type LoginStep = 'phone' | 'otp' | 'password';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [userExists, setUserExists] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, purpose: 'LOGIN' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('OTP sent successfully!');
        setStep('otp');
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp, purpose: 'LOGIN' }
      });

      if (error) throw error;

      if (data.success && data.verified) {
        if (data.userExists) {
          setUserExists(true);
          setStep('password');
        } else {
          // User doesn't exist, redirect to register
          toast.info('No account found. Please create an account.');
          navigate('/register', { state: { phone, otpVerified: true } });
        }
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Format phone for email-like login
      const formattedPhone = phone.replace(/\D/g, '');
      const phoneEmail = `${formattedPhone}@phone.ictacademy.lk`;

      const { error } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone, purpose: 'LOGIN' }
      });

      if (error) throw error;
      toast.success('OTP resent successfully!');
    } catch (error: any) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 py-8 gap-8">
        {/* Left Side - Branding */}
        <div className="text-center lg:text-left lg:flex-1 lg:max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">ictfromabc</h1>
          <p className="text-gray-300 text-sm md:text-base">
            ලංකාවේ විශාලතම පොරගනුදු තාක්ෂණ පන්තිය
          </p>
          <p className="text-gray-400 text-sm">
            ගණකාංජේ බැඳිම <span className="text-white">A</span> සහ <span className="text-white">B</span> සාමාන්‍ය අභිත
          </p>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-sm">
          <div className="bg-gray-100 rounded-lg p-6 shadow-xl">
            {/* Step 1: Phone */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  Enter Your Phone Number
                </h2>
                
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white border-gray-300 text-center text-lg"
                  required
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Create Account
                  </Link>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="font-medium text-gray-900">Need Help?</p>
                  <p className="text-gray-600">Phone: 071 455 5513</p>
                </div>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  Enter Verification Code
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  OTP sent to {phone}
                </p>
                
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-white border-gray-300 text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep('phone')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>

                <button 
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-700"
                >
                  Resend OTP
                </button>
              </form>
            )}

            {/* Step 3: Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  Enter Your Password
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  Welcome back! Please enter your password.
                </p>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white border-gray-300 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep('otp')}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>

                <Link 
                  to="/forgot-password" 
                  className="block text-center text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4">
        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-4">
          <a href="#" className="text-red-500 hover:text-red-400 transition-colors">
            <Youtube className="w-8 h-8" />
          </a>
          <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-400 text-sm mb-4">
          ©2025. All rights reserved.
        </p>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-4">
          <Link to="/past-papers">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Past Papers
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              <Info className="w-4 h-4 mr-2" />
              About Us
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Login;
